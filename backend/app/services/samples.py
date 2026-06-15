import json
import shutil
import uuid
from pathlib import Path

from PIL import Image

from app.config import get_settings
from app.schemas import DocumentExtraction, SampleInfo
from app.services.documents import (
    StoredDocument,
    preview_url,
    save_extraction,
    write_metadata,
)
from app.services.pdf_layout import enrich_extraction_regions
from app.services.pdf_preview import rasterize_pdf

SAMPLES_DIR = Path(__file__).resolve().parents[2] / "samples"
REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_SAMPLES_DIR = REPO_ROOT / "data" / "samples"


def _manifest() -> list[dict]:
    path = SAMPLES_DIR / "manifest.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))["samples"]


def _manifest_entry(sample_id: str) -> dict:
    for entry in _manifest():
        if entry["id"] == sample_id:
            return entry
    raise FileNotFoundError("Sample not found.")


def resolve_sample_pdf(sample_id: str) -> Path:
    entry = _manifest_entry(sample_id)
    pdf_name = entry.get("pdf_file")
    if pdf_name:
        data_pdf = DATA_SAMPLES_DIR / pdf_name
        if data_pdf.exists():
            return data_pdf
        bundled = SAMPLES_DIR / sample_id / pdf_name
        if bundled.exists():
            return bundled
        bundled_doc = SAMPLES_DIR / sample_id / "document.pdf"
        if bundled_doc.exists():
            return bundled_doc
    legacy = SAMPLES_DIR / sample_id / "preview.png"
    if legacy.exists():
        raise FileNotFoundError(f"No PDF found for sample {sample_id}.")
    raise FileNotFoundError("Sample not found.")


def list_samples() -> list[SampleInfo]:
    items: list[SampleInfo] = []
    for entry in _manifest():
        sample_id = entry["id"]
        try:
            resolve_sample_pdf(sample_id)
        except FileNotFoundError:
            thumb = SAMPLES_DIR / sample_id / "preview.png"
            if not thumb.exists():
                continue
        items.append(
            SampleInfo(
                id=sample_id,
                name=entry["name"],
                description=entry["description"],
                pitch_priority=entry.get("pitch_priority", 99),
                recommended_lead=bool(entry.get("recommended_lead", False)),
                thumbnail_url=f"/api/samples/{sample_id}/thumbnail",
            )
        )
    return sorted(items, key=lambda item: item.pitch_priority)


def sample_thumbnail_path(sample_id: str) -> Path:
    thumb = SAMPLES_DIR / sample_id / "preview.png"
    if thumb.exists():
        return thumb
    pdf_path = resolve_sample_pdf(sample_id)
    pages, _, _ = rasterize_pdf(pdf_path)
    if not pages:
        raise FileNotFoundError("Sample not found.")
    cache = SAMPLES_DIR / sample_id / "preview.png"
    cache.parent.mkdir(parents=True, exist_ok=True)
    pages[0].save(cache, format="PNG", optimize=True)
    return cache


def load_sample_extraction(sample_id: str) -> DocumentExtraction:
    path = SAMPLES_DIR / sample_id / "extraction.json"
    if not path.exists():
        raise FileNotFoundError("Sample not found.")
    return DocumentExtraction.model_validate(json.loads(path.read_text(encoding="utf-8")))


def load_sample_document(sample_id: str) -> tuple[StoredDocument, DocumentExtraction]:
    settings = get_settings()
    entry = _manifest_entry(sample_id)
    pdf_path = resolve_sample_pdf(sample_id)
    extraction = enrich_extraction_regions(load_sample_extraction(sample_id), pdf_path)

    document_id = uuid.uuid4().hex
    preview_dir = settings.data_dir / "previews" / document_id
    preview_dir.mkdir(parents=True, exist_ok=True)

    original_path = settings.data_dir / "uploads" / f"{document_id}.pdf"
    shutil.copy(pdf_path, original_path)

    page_images, preview_mode, _ = rasterize_pdf(original_path)
    preview_paths: list[Path] = []
    for index, image in enumerate(page_images, start=1):
        preview_path = preview_dir / f"page-{index}.png"
        rgb = image.convert("RGB")
        rgb.thumbnail((2400, 2400), Image.Resampling.LANCZOS)
        rgb.save(preview_path, format="PNG", optimize=True)
        preview_paths.append(preview_path)

    pdf_filename = entry.get("pdf_file") or f"{sample_id}.pdf"
    write_metadata(
        document_id,
        {
            "document_id": document_id,
            "filename": pdf_filename,
            "content_type": "application/pdf",
            "original_path": str(original_path),
            "preview_paths": [str(path) for path in preview_paths],
            "preview_mode": preview_mode,
            "sample_id": sample_id,
        },
    )
    save_extraction(document_id, extraction)

    document = StoredDocument(
        document_id=document_id,
        filename=pdf_filename,
        content_type="application/pdf",
        original_path=original_path,
        preview_paths=preview_paths,
        preview_mode=preview_mode,
    )
    return document, extraction


def entry_name(sample_id: str) -> str:
    for entry in _manifest():
        if entry["id"] == sample_id:
            return entry["name"].lower().replace(" ", "-")
    return sample_id
