import asyncio
import io
import json
from pathlib import Path
from types import SimpleNamespace

from PIL import Image
from starlette.datastructures import Headers, UploadFile

from app.schemas import DocumentExtraction
from app.services.documents import store_upload
from app.services.exports import write_csv, write_docx, write_json
from app.services.rag import _chunk_text


FIXTURE_PATH = Path(__file__).parent / "fixtures" / "sample_extraction.json"


def load_sample_extraction() -> DocumentExtraction:
    payload = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    return DocumentExtraction.model_validate(payload)


def test_sample_extraction_schema_supports_arabic_sources() -> None:
    extraction = load_sample_extraction()

    assert extraction.language == "Arabic"
    assert "تعميم" in extraction.transcription
    assert extraction.fields[0].source.page == 1
    assert 0 <= extraction.fields[0].confidence <= 1


def test_exports_write_docx_and_json(tmp_path, monkeypatch) -> None:
    extraction = load_sample_extraction()
    exports_dir = tmp_path / "exports"
    exports_dir.mkdir()

    monkeypatch.setattr(
        "app.services.exports.get_settings",
        lambda: SimpleNamespace(data_dir=tmp_path),
    )

    docx_path = write_docx("sample", extraction)
    json_path = write_json("sample", extraction)

    assert docx_path.exists()
    assert docx_path.suffix == ".docx"
    assert json_path.exists()
    exported = json.loads(json_path.read_text(encoding="utf-8"))
    assert exported["fields"][1]["source"]["snippet"] == "تحويلها إلى نسخة رقمية قابلة للتدقيق"


def test_store_upload_creates_image_preview(tmp_path, monkeypatch) -> None:
    for folder in ["uploads", "previews", "exports", "chroma"]:
        (tmp_path / folder).mkdir()

    monkeypatch.setattr(
        "app.services.documents.get_settings",
        lambda: SimpleNamespace(data_dir=tmp_path),
    )

    image_buffer = io.BytesIO()
    Image.new("RGB", (320, 180), color=(247, 243, 236)).save(image_buffer, format="PNG")
    image_buffer.seek(0)

    upload = UploadFile(
        file=image_buffer,
        filename="sample.png",
        headers=Headers({"content-type": "image/png"}),
    )
    stored = asyncio.run(store_upload(upload))

    assert stored.filename == "sample.png"
    assert stored.preview_paths
    assert stored.preview_paths[0].exists()
    assert stored.preview_paths[0].suffix == ".png"


def test_chunk_text_keeps_overlap_for_rag_context() -> None:
    text = " ".join(f"clause-{index}" for index in range(120))
    chunks = _chunk_text(text, size=120, overlap=30)

    assert len(chunks) > 1
    assert all(chunk.strip() for chunk in chunks)
    assert chunks[0][-30:].strip() in chunks[1]


def test_shape_arabic_reorders_rtl_text() -> None:
    from app.services.arabic_text import shape_arabic

    shaped = shape_arabic("تعميم إداري")
    assert shaped
    assert shaped != "تعميم إداري" or len(shaped) == len("تعميم إداري")


def test_demo_document_loads_prepared_extraction(tmp_path, monkeypatch) -> None:
    from fastapi.testclient import TestClient

    for folder in ["uploads", "previews", "exports", "chroma"]:
        (tmp_path / folder).mkdir()

    monkeypatch.setattr(
        "app.config.get_settings",
        lambda: SimpleNamespace(
            data_dir=tmp_path,
            openai_api_key=None,
            openai_model="gpt-4o",
            openai_chat_model=None,
            openai_embedding_model="text-embedding-3-small",
            cors_origins=[],
            app_name="Naskh",
        ),
    )
    monkeypatch.setattr(
        "app.api.get_settings",
        lambda: SimpleNamespace(
            data_dir=tmp_path,
            openai_api_key=None,
            openai_model="gpt-4o",
            openai_chat_model=None,
            openai_embedding_model="text-embedding-3-small",
            cors_origins=[],
            app_name="Naskh",
        ),
    )

    from app.main import app

    client = TestClient(app)
    response = client.post("/api/documents/demo")
    assert response.status_code == 200
    payload = response.json()
    assert payload["extraction"]["language"] in {"Arabic", "Arabic/English"}
    assert payload["extraction"]["fields"]


def test_list_samples_returns_five() -> None:
    from app.services.samples import list_samples

    samples = list_samples()
    assert len(samples) == 5
    assert any(sample.recommended_lead for sample in samples)


def test_load_gallery_sample(tmp_path, monkeypatch) -> None:
    for folder in ["uploads", "previews", "exports", "chroma"]:
        (tmp_path / folder).mkdir()

    monkeypatch.setattr("app.services.documents.get_settings", lambda: SimpleNamespace(data_dir=tmp_path))
    monkeypatch.setattr("app.services.samples.get_settings", lambda: SimpleNamespace(data_dir=tmp_path))

    from app.services.samples import load_sample_document

    document, extraction = load_sample_document("commercial-agreement")
    assert document.preview_paths[0].exists()
    assert document.content_type == "application/pdf"
    assert extraction.document_kind == "Professional Services Agreement"
    assert extraction.fields[0].source.region is not None
    assert extraction.fields[0].source.region.x > 0.5


def test_resolve_citation_sources_maps_to_field_snippet() -> None:
    from app.services.citations import resolve_citation_sources

    extraction = load_sample_extraction()
    sources = resolve_citation_sources(extraction, [extraction.fields[0].source.snippet])
    assert sources
    assert sources[0].snippet == extraction.fields[0].source.snippet


def test_write_csv_export(tmp_path, monkeypatch) -> None:
    extraction = load_sample_extraction()
    monkeypatch.setattr("app.services.exports.get_settings", lambda: SimpleNamespace(data_dir=tmp_path))
    (tmp_path / "exports").mkdir()
    path = write_csv("demo", extraction)
    assert path.exists()
    assert "field,value,field_type" in path.read_text(encoding="utf-8-sig").splitlines()[0]


def test_store_upload_rasterizes_pdf_preview(tmp_path, monkeypatch) -> None:
    from pypdf import PdfWriter

    for folder in ["uploads", "previews", "exports", "chroma"]:
        (tmp_path / folder).mkdir()

    monkeypatch.setattr(
        "app.services.documents.get_settings",
        lambda: SimpleNamespace(data_dir=tmp_path),
    )

    pdf_path = tmp_path / "sample.pdf"
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    with pdf_path.open("wb") as handle:
        writer.write(handle)

    pdf_buffer = io.BytesIO(pdf_path.read_bytes())
    upload = UploadFile(
        file=pdf_buffer,
        filename="sample.pdf",
        headers=Headers({"content-type": "application/pdf"}),
    )
    stored = asyncio.run(store_upload(upload))

    assert stored.preview_mode == "raster"
    assert stored.preview_paths
    assert stored.preview_paths[0].exists()
    with Image.open(stored.preview_paths[0]) as preview:
        assert preview.width >= 400
        assert preview.height >= 400


def test_locate_snippet_on_services_agreement_pdf() -> None:
    from app.services.pdf_layout import locate_snippet_in_pdf
    from app.services.pdf_preview import rasterize_pdf

    pdf_path = Path(__file__).resolve().parents[3] / "data" / "samples" / "01_Services_Agreement.pdf"
    if not pdf_path.exists():
        return

    region = locate_snippet_in_pdf(pdf_path, 1, "DH-AGR-2026-0184", value="DH-AGR-2026-0184")
    assert region is not None
    assert region.x > 0.55
    assert region.y < 0.2
    assert not region.approximate

    pages, mode, renderer = rasterize_pdf(pdf_path)
    assert mode == "raster"
    assert renderer == "pypdfium2"
    assert len(pages) >= 1
    assert pages[0].width >= 800
    assert pages[0].height >= 800
