import json
import shutil
import uuid
from pathlib import Path

from app.config import get_settings
from app.schemas import DocumentExtraction, SampleInfo
from app.services.documents import (
    StoredDocument,
    preview_url,
    save_extraction,
    write_metadata,
)

SAMPLES_DIR = Path(__file__).resolve().parents[2] / "samples"


def _manifest() -> list[dict]:
    path = SAMPLES_DIR / "manifest.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))["samples"]


def list_samples() -> list[SampleInfo]:
    items: list[SampleInfo] = []
    for entry in _manifest():
        sample_id = entry["id"]
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
    path = SAMPLES_DIR / sample_id / "preview.png"
    if not path.exists():
        raise FileNotFoundError("Sample not found.")
    return path


def load_sample_extraction(sample_id: str) -> DocumentExtraction:
    path = SAMPLES_DIR / sample_id / "extraction.json"
    if not path.exists():
        raise FileNotFoundError("Sample not found.")
    return DocumentExtraction.model_validate(json.loads(path.read_text(encoding="utf-8")))


def load_sample_document(sample_id: str) -> tuple[StoredDocument, DocumentExtraction]:
    settings = get_settings()
    folder = SAMPLES_DIR / sample_id
    preview_src = folder / "preview.png"
    if not preview_src.exists():
        raise FileNotFoundError("Sample not found.")

    extraction = load_sample_extraction(sample_id)
    document_id = uuid.uuid4().hex
    preview_dir = settings.data_dir / "previews" / document_id
    preview_dir.mkdir(parents=True, exist_ok=True)
    preview_path = preview_dir / "page-1.png"
    shutil.copy(preview_src, preview_path)

    original_path = settings.data_dir / "uploads" / f"{document_id}.png"
    shutil.copy(preview_src, original_path)

    write_metadata(
        document_id,
        {
            "document_id": document_id,
            "filename": f"{sample_id}.png",
            "content_type": "image/png",
            "original_path": str(original_path),
            "preview_paths": [str(preview_path)],
            "sample_id": sample_id,
        },
    )
    save_extraction(document_id, extraction)

    document = StoredDocument(
        document_id=document_id,
        filename=f"{entry_name(sample_id)}.png",
        content_type="image/png",
        original_path=original_path,
        preview_paths=[preview_path],
    )
    return document, extraction


def entry_name(sample_id: str) -> str:
    for entry in _manifest():
        if entry["id"] == sample_id:
            return entry["name"].lower().replace(" ", "-")
    return sample_id
