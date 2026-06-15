from __future__ import annotations

import logging
from pathlib import Path
from typing import Literal

from PIL import Image, ImageDraw
from pypdf import PdfReader

from app.services.arabic_text import load_arabic_font, shape_arabic

logger = logging.getLogger(__name__)

PreviewMode = Literal["raster", "text"]

# scale 2.0 ≈ 144 DPI; 2.78 ≈ 200 DPI — crisp text without huge files
PDF_RENDER_SCALE = 2.0
MAX_RASTER_LONG_EDGE = 2400

PAGE_WIDTH = 900
PAGE_HEIGHT = 1200
MARGIN_X = 56
MARGIN_TOP = 110
MARGIN_BOTTOM = 56
CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2
LINE_HEIGHT = 34


def rasterize_pdf(pdf_path: Path) -> tuple[list[Image.Image], PreviewMode, str | None]:
    """Render every PDF page to PIL images. Returns (pages, mode, renderer_name)."""
    pdf_bytes = pdf_path.read_bytes()

    for name, renderer in (
        ("pypdfium2", _render_pypdfium2),
        ("pymupdf", _render_pymupdf),
        ("pdf2image", _render_pdf2image),
    ):
        try:
            pages = renderer(pdf_bytes)
            if pages:
                logger.info("PDF preview rendered with %s (%s page(s))", name, len(pages))
                return pages, "raster", name
        except Exception as exc:
            logger.debug("PDF renderer %s unavailable or failed: %s", name, exc)

    logger.warning("All PDF rasterizers failed for %s — using text fallback", pdf_path.name)
    return _render_text_fallback(pdf_path), "text", None


def _render_pypdfium2(pdf_bytes: bytes) -> list[Image.Image]:
    import pypdfium2 as pdfium

    pdf = pdfium.PdfDocument(pdf_bytes)
    images: list[Image.Image] = []
    try:
        for index in range(len(pdf)):
            bitmap = pdf[index].render(scale=PDF_RENDER_SCALE)
            images.append(bitmap.to_pil().convert("RGB"))
    finally:
        pdf.close()
    return images


def _render_pymupdf(pdf_bytes: bytes) -> list[Image.Image]:
    import fitz

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images: list[Image.Image] = []
    matrix = fitz.Matrix(PDF_RENDER_SCALE, PDF_RENDER_SCALE)
    try:
        for page in doc:
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            images.append(Image.frombytes("RGB", (pix.width, pix.height), pix.samples))
    finally:
        doc.close()
    return images


def _render_pdf2image(pdf_bytes: bytes) -> list[Image.Image]:
    from pdf2image import convert_from_bytes
    from pdf2image.exceptions import PDFInfoNotInstalledError

    try:
        return convert_from_bytes(pdf_bytes, dpi=180, fmt="png")
    except PDFInfoNotInstalledError as exc:
        raise RuntimeError("Poppler is not installed") from exc


def _has_arabic(text: str) -> bool:
    return any("\u0600" <= char <= "\u06FF" for char in text)


def _text_width(draw: ImageDraw.ImageDraw, text: str, font) -> float:
    if hasattr(draw, "textlength"):
        return float(draw.textlength(text, font=font))
    bbox = draw.textbbox((0, 0), text, font=font)
    return float(bbox[2] - bbox[0])


def _wrap_line(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    words = text.split()
    if not words:
        return [text] if text else []

    lines: list[str] = []
    bucket: list[str] = []
    for word in words:
        candidate = " ".join([*bucket, word])
        display = shape_arabic(candidate) if _has_arabic(candidate) else candidate
        if _text_width(draw, display, font) <= max_width:
            bucket.append(word)
        else:
            if bucket:
                lines.append(" ".join(bucket))
            bucket = [word]
    if bucket:
        lines.append(" ".join(bucket))
    return lines or [text]


def _new_text_page(title: str = "Naskh PDF preview (text fallback)") -> Image.Image:
    image = Image.new("RGB", (PAGE_WIDTH, PAGE_HEIGHT), color=(251, 247, 239))
    draw = ImageDraw.Draw(image)
    font = load_arabic_font(24)
    draw.rectangle((36, 36, 864, 1164), outline=(183, 114, 69), width=3)
    draw.text((MARGIN_X, 56), title, font=font, fill=(23, 32, 51))
    return image


def _draw_line(draw: ImageDraw.ImageDraw, y: int, line: str, font) -> None:
    if not line.strip():
        return
    rtl = _has_arabic(line)
    if rtl:
        draw.text((PAGE_WIDTH - MARGIN_X, y), shape_arabic(line), font=font, fill=(23, 32, 51), anchor="ra")
    else:
        draw.text((MARGIN_X, y), line, font=font, fill=(23, 32, 51), anchor="la")


def _render_text_fallback(pdf_path: Path) -> list[Image.Image]:
    reader = PdfReader(str(pdf_path))
    blocks = [(page.extract_text() or "").strip() for page in reader.pages]
    full = "\n\n".join(block for block in blocks if block).strip()
    if not full:
        full = (
            "PDF uploaded successfully. Page content could not be extracted for a text preview. "
            "Try re-uploading or use a PNG/JPEG photo."
        )

    font = load_arabic_font(22)
    scratch = Image.new("RGB", (PAGE_WIDTH, PAGE_HEIGHT))
    scratch_draw = ImageDraw.Draw(scratch)

    typed_lines: list[tuple[str, bool]] = []
    for paragraph in full.split("\n\n"):
        for raw in paragraph.split("\n"):
            raw = raw.strip()
            if not raw:
                typed_lines.append(("", False))
                continue
            rtl = _has_arabic(raw)
            max_width = int(CONTENT_WIDTH * 0.95)
            for wrapped in _wrap_line(scratch_draw, raw, font, max_width):
                typed_lines.append((wrapped, rtl))

    pages: list[Image.Image] = []
    image = _new_text_page()
    draw = ImageDraw.Draw(image)
    y = MARGIN_TOP
    y_limit = PAGE_HEIGHT - MARGIN_BOTTOM

    for line, _rtl in typed_lines:
        if y + LINE_HEIGHT > y_limit:
            pages.append(image)
            image = _new_text_page(title="")
            draw = ImageDraw.Draw(image)
            y = MARGIN_TOP

        if not line:
            y += LINE_HEIGHT // 2
            continue

        _draw_line(draw, y, line, font)
        y += LINE_HEIGHT

    pages.append(image)
    return pages
