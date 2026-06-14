from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.config import get_settings
from app.schemas import ChatAnswer, ChatRequest, ChatResponse, ProcessResponse, SourceRegion, UploadResponse
from app.services.ai import AiService
from app.services.documents import (
    create_demo_document,
    image_data_urls,
    load_document,
    load_extraction,
    load_sample_extraction,
    preview_url,
    save_extraction,
    store_upload,
)
from app.services.exports import write_docx, write_json
from app.services.rag import RagService

router = APIRouter(prefix="/api")


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/documents/demo", response_model=UploadResponse)
def load_demo_document() -> UploadResponse:
    document = create_demo_document()
    return UploadResponse(
        document_id=document.document_id,
        filename=document.filename,
        content_type=document.content_type,
        preview_urls=[preview_url(document.document_id, path) for path in document.preview_paths],
    )


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
    try:
        document = load_document(document_id)
        if settings.openai_api_key:
            ai = AiService(settings)
            extraction = ai.extract_document(image_data_urls(document))
        else:
            extraction = load_sample_extraction()
            extraction.notes = [
                *extraction.notes,
                "Demo fallback: set OPENAI_API_KEY in backend/.env to run live vision extraction.",
            ]
        save_extraction(document_id, extraction)
        if settings.openai_api_key:
            RagService(settings).index_extraction(document_id, extraction)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return ProcessResponse(document_id=document_id, extraction=extraction)


@router.post("/documents/{document_id}/chat", response_model=ChatResponse)
def chat(document_id: str, request: ChatRequest) -> ChatResponse:
    settings = get_settings()
    try:
        extraction = load_extraction(document_id)
        if settings.openai_api_key:
            excerpts = RagService(settings).retrieve(document_id, request.question)
            answer = AiService(settings).answer_question(request.question, excerpts)
        else:
            answer = _demo_chat_answer(request.question, extraction)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return ChatResponse(document_id=document_id, answer=answer)


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


def _demo_chat_answer(question: str, extraction) -> ChatAnswer:
    question_lower = question.lower()
    matched_field = next((field for field in extraction.fields if field.label.lower() in question_lower), extraction.fields[0])
    if any(token in question_lower for token in ["title", "document", "عنوان", "تعميم"]):
        matched_field = extraction.fields[0]
    snippet = matched_field.source.snippet if matched_field else extraction.transcription.split("\n")[0]
    answer = f"{matched_field.label}: {matched_field.value}" if matched_field else extraction.summary
    source = matched_field.source if matched_field else SourceRegion(page=1, snippet=snippet)
    return ChatAnswer(answer=answer, source_snippets=[source])
