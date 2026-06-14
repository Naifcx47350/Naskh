import base64
import io
import json
import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile
from pdf2image import convert_from_bytes
from PIL import Image, ImageDraw, ImageOps
from pypdf import PdfReader

from app.config import get_settings
from app.schemas import DocumentExtraction


SUPPORTED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp"}
SUPPORTED_PDF_TYPES = {"application/pdf"}


class StoredDocument:
    def __init__(
        self,
        document_id: str,
        filename: str,
        content_type: str,
        original_path: Path,
        preview_paths: list[Path],
    ) -> None:
        self.document_id = document_id
        self.filename = filename
        self.content_type = content_type
        self.original_path = original_path
        self.preview_paths = preview_paths


def _safe_suffix(filename: str, content_type: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix:
        return suffix
    return ".pdf" if content_type in SUPPORTED_PDF_TYPES else ".png"


def _normalise_image(image: Image.Image) -> Image.Image:
    image = ImageOps.exif_transpose(image).convert("RGB")
    image.thumbnail((1800, 2400))
    return image


def _write_preview(image: Image.Image, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    _normalise_image(image).save(destination, format="PNG", optimize=True)


def _wrap_text(text: str, width: int = 58) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current: list[str] = []
    for word in words:
        candidate = " ".join([*current, word])
        if len(candidate) <= width:
            current.append(word)
        else:
            if current:
                lines.append(" ".join(current))
            current = [word]
    if current:
        lines.append(" ".join(current))
    return lines or [text[:width]]


def _pdf_text_preview(pdf_path: Path, destination: Path) -> None:
    reader = PdfReader(str(pdf_path))
    extracted = "\n\n".join((page.extract_text() or "").strip() for page in reader.pages[:2]).strip()
    if not extracted:
        extracted = "PDF uploaded successfully. Install Poppler for pixel-perfect previews, or upload a PNG/JPEG photo for the live demo."

    image = Image.new("RGB", (900, 1200), color=(251, 247, 239))
    draw = ImageDraw.Draw(image)
    draw.rectangle((36, 36, 864, 1164), outline=(183, 114, 69), width=3)
    draw.text((56, 56), "Naskh PDF preview", fill=(23, 32, 51))
    y = 110
    for line in _wrap_text(extracted, width=72)[:28]:
        draw.text((56, y), line, fill=(23, 32, 51))
        y += 34
    _write_preview(image, destination)


async def store_upload(file: UploadFile) -> StoredDocument:
    settings = get_settings()
    if file.content_type not in SUPPORTED_IMAGE_TYPES | SUPPORTED_PDF_TYPES:
        raise ValueError("Upload a PDF, PNG, JPEG, or WebP document.")

    document_id = uuid.uuid4().hex
    suffix = _safe_suffix(file.filename or "document", file.content_type or "")
    original_path = settings.data_dir / "uploads" / f"{document_id}{suffix}"

    with original_path.open("wb") as output:
        shutil.copyfileobj(file.file, output)

    preview_dir = settings.data_dir / "previews" / document_id
    preview_paths: list[Path] = []

    if file.content_type in SUPPORTED_IMAGE_TYPES:
        with Image.open(original_path) as image:
            preview_path = preview_dir / "page-1.png"
            _write_preview(image, preview_path)
            preview_paths.append(preview_path)
    else:
        pdf_bytes = original_path.read_bytes()
        try:
            pages = convert_from_bytes(pdf_bytes, dpi=180, fmt="png")
            for index, page in enumerate(pages[:5], start=1):
                preview_path = preview_dir / f"page-{index}.png"
                _write_preview(page, preview_path)
                preview_paths.append(preview_path)
        except Exception:
            preview_path = preview_dir / "page-1.png"
            _pdf_text_preview(original_path, preview_path)
            preview_paths.append(preview_path)

    write_metadata(
        document_id,
        {
            "document_id": document_id,
            "filename": file.filename or "document",
            "content_type": file.content_type,
            "original_path": str(original_path),
            "preview_paths": [str(path) for path in preview_paths],
        },
    )

    return StoredDocument(
        document_id=document_id,
        filename=file.filename or "document",
        content_type=file.content_type or "application/octet-stream",
        original_path=original_path,
        preview_paths=preview_paths,
    )


def preview_url(document_id: str, preview_path: Path) -> str:
    return f"/api/documents/{document_id}/previews/{preview_path.name}"


def preview_data_url(path: Path) -> str:
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def metadata_path(document_id: str) -> Path:
    return get_settings().data_dir / "uploads" / f"{document_id}.json"


def write_metadata(document_id: str, payload: dict) -> None:
    metadata_path(document_id).write_text(json.dumps(payload, indent=2), encoding="utf-8")


def read_metadata(document_id: str) -> dict:
    path = metadata_path(document_id)
    if not path.exists():
        raise FileNotFoundError("Document not found.")
    return json.loads(path.read_text(encoding="utf-8"))


def load_document(document_id: str) -> StoredDocument:
    metadata = read_metadata(document_id)
    return StoredDocument(
        document_id=document_id,
        filename=metadata["filename"],
        content_type=metadata["content_type"],
        original_path=Path(metadata["original_path"]),
        preview_paths=[Path(path) for path in metadata["preview_paths"]],
    )


def save_extraction(document_id: str, extraction: DocumentExtraction) -> None:
    metadata = read_metadata(document_id)
    metadata["extraction"] = extraction.model_dump()
    write_metadata(document_id, metadata)


def load_extraction(document_id: str) -> DocumentExtraction:
    metadata = read_metadata(document_id)
    if "extraction" not in metadata:
        raise FileNotFoundError("Process the document before using this action.")
    return DocumentExtraction.model_validate(metadata["extraction"])


def image_data_urls(document: StoredDocument) -> list[str]:
    return [preview_data_url(path) for path in document.preview_paths]


def create_demo_document() -> StoredDocument:
    settings = get_settings()
    document_id = uuid.uuid4().hex
    preview_dir = settings.data_dir / "previews" / document_id
    preview_path = preview_dir / "page-1.png"

    image = Image.new("RGB", (900, 1200), color=(251, 247, 239))
    draw = ImageDraw.Draw(image)
    draw.rectangle((36, 36, 864, 1164), outline=(183, 114, 69), width=3)
    arabic_lines = [
        "بسم الله الرحمن الرحيم",
        "تعميم إداري بشأن مراجعة السجلات الورقية",
        "وتحويلها إلى نسخة رقمية قابلة للتدقيق.",
    ]
    y = 120
    for line in arabic_lines:
        draw.text((700, y), line, fill=(23, 32, 51), anchor="ra")
        y += 70
    _write_preview(image, preview_path)

    original_path = settings.data_dir / "uploads" / f"{document_id}.png"
    shutil.copy(preview_path, original_path)

    write_metadata(
        document_id,
        {
            "document_id": document_id,
            "filename": "demo-regulatory-memo.png",
            "content_type": "image/png",
            "original_path": str(original_path),
            "preview_paths": [str(preview_path)],
        },
    )

    return StoredDocument(
        document_id=document_id,
        filename="demo-regulatory-memo.png",
        content_type="image/png",
        original_path=original_path,
        preview_paths=[preview_path],
    )


def load_sample_extraction() -> DocumentExtraction:
    fixture = Path(__file__).resolve().parents[2] / "tests" / "fixtures" / "sample_extraction.json"
    payload = json.loads(fixture.read_text(encoding="utf-8"))
    return DocumentExtraction.model_validate(payload)
