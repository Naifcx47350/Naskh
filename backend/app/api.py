import json
import logging

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse

from app.config import get_settings
from app.schemas import (
    ChatRequest,
    ChatResponse,
    ExtractionUpdate,
    ProcessResponse,
    SampleInfo,
    SourceRegion,
    UploadResponse,
)
from app.services.ai import AiService
from app.services.citations import resolve_citation_sources
from app.services.documents import (
    image_data_urls,
    load_document,
    load_extraction,
    preview_url,
    save_extraction,
    store_upload,
)
from app.services.exports import write_csv, write_docx, write_json
from app.services.pdf_layout import enrich_extraction_regions
from app.services.rag import RagService
from app.services.samples import list_samples, load_sample_document, sample_thumbnail_path

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")


def _require_api_key(settings) -> None:
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503,
            detail="Set OPENAI_API_KEY in backend/.env to use live AI extraction and chat.",
        )


@router.get("/health")
def health() -> dict[str, str | bool]:
    settings = get_settings()
    return {"status": "ok", "ai_ready": bool(settings.openai_api_key)}


@router.get("/samples", response_model=list[SampleInfo])
def get_samples() -> list[SampleInfo]:
    return list_samples()


@router.get("/samples/{sample_id}/thumbnail")
def get_sample_thumbnail(sample_id: str) -> FileResponse:
    try:
        path = sample_thumbnail_path(sample_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return FileResponse(path, media_type="image/png")


@router.post("/samples/{sample_id}/load", response_model=UploadResponse)
def load_sample(sample_id: str) -> UploadResponse:
    settings = get_settings()
    try:
        document, extraction = load_sample_document(sample_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    if settings.openai_api_key:
        RagService(settings).index_extraction(document.document_id, extraction)

    return UploadResponse(
        document_id=document.document_id,
        filename=document.filename,
        content_type=document.content_type,
        preview_urls=[preview_url(document.document_id, path) for path in document.preview_paths],
        preview_mode=document.preview_mode,
        extraction=extraction,
    )


@router.post("/documents/demo", response_model=UploadResponse)
def load_demo_document() -> UploadResponse:
    return load_sample("saudi-regulatory-circular")


@router.post("/documents/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)) -> UploadResponse:
    try:
        document = await store_upload(file)
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return UploadResponse(
        document_id=document.document_id,
        filename=document.filename,
        content_type=document.content_type,
        preview_urls=[preview_url(document.document_id, path) for path in document.preview_paths],
        preview_mode=document.preview_mode,
    )


@router.get("/documents/{document_id}/previews/{filename}")
def get_preview(document_id: str, filename: str) -> FileResponse:
    document = load_document(document_id)
    for path in document.preview_paths:
        if path.name == filename:
            return FileResponse(path, media_type="image/png")
    raise HTTPException(status_code=404, detail="Preview not found.")


@router.post("/documents/{document_id}/process", response_model=ProcessResponse)
def process_document(document_id: str) -> ProcessResponse:
    settings = get_settings()
    _require_api_key(settings)
    try:
        document = load_document(document_id)
        ai = AiService(settings)
        extraction = ai.extract_document(image_data_urls(document))
        if document.content_type == "application/pdf":
            extraction = enrich_extraction_regions(extraction, document.original_path)
        save_extraction(document_id, extraction)
        RagService(settings).index_extraction(document_id, extraction)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return ProcessResponse(document_id=document_id, extraction=extraction)


@router.patch("/documents/{document_id}/extraction", response_model=ProcessResponse)
def patch_extraction(document_id: str, body: ExtractionUpdate) -> ProcessResponse:
    settings = get_settings()
    try:
        extraction = load_extraction(document_id)
        if body.transcription is not None:
            extraction.transcription = body.transcription
        if body.fields is not None:
            extraction.fields = body.fields
        save_extraction(document_id, extraction)
        if settings.openai_api_key:
            RagService(settings).index_extraction(document_id, extraction)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return ProcessResponse(document_id=document_id, extraction=extraction)


@router.post("/documents/{document_id}/chat", response_model=ChatResponse)
def chat(document_id: str, request: ChatRequest) -> ChatResponse:
    settings = get_settings()
    _require_api_key(settings)
    try:
        extraction = load_extraction(document_id)
        excerpts = RagService(settings).retrieve(document_id, request.question)
        answer = AiService(settings).answer_question(request.question, excerpts)
        if not answer.source_snippets:
            answer.source_snippets = resolve_citation_sources(extraction, excerpts)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return ChatResponse(document_id=document_id, answer=answer)


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


@router.post("/documents/{document_id}/chat/stream")
def chat_stream(document_id: str, request: ChatRequest) -> StreamingResponse:
    settings = get_settings()
    _require_api_key(settings)

    def event_stream():
        try:
            extraction = load_extraction(document_id)
            excerpts = RagService(settings).retrieve(document_id, request.question)
            sources = resolve_citation_sources(extraction, excerpts)
            for token in AiService(settings).stream_answer_question(request.question, excerpts):
                yield _sse({"type": "token", "value": token})
            yield _sse({"type": "sources", "value": [source.model_dump() for source in sources]})
            yield _sse({"type": "done"})
        except FileNotFoundError:
            yield _sse({"type": "error", "value": "Process the document before chatting."})
        except Exception:  # noqa: BLE001
            logger.exception("Streaming chat failed for document %s", document_id)
            yield _sse({"type": "error", "value": "The assistant could not complete the answer."})

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/documents/{document_id}/export/docx")
def export_docx(document_id: str) -> FileResponse:
    try:
        extraction = load_extraction(document_id)
        path = write_docx(document_id, extraction)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return FileResponse(
        path,
        filename=f"naskh-{document_id}.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


@router.get("/documents/{document_id}/export/json")
def export_json(document_id: str) -> FileResponse:
    try:
        extraction = load_extraction(document_id)
        path = write_json(document_id, extraction)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return FileResponse(path, filename=f"naskh-{document_id}.json", media_type="application/json")


@router.get("/documents/{document_id}/export/csv")
def export_csv(document_id: str) -> FileResponse:
    try:
        extraction = load_extraction(document_id)
        path = write_csv(document_id, extraction)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return FileResponse(path, filename=f"naskh-{document_id}.csv", media_type="text/csv")
