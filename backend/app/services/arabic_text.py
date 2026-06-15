import logging
from pathlib import Path

import arabic_reshaper
from bidi.algorithm import get_display
from PIL import ImageFont

logger = logging.getLogger(__name__)

_FONT_PATH = Path(__file__).resolve().parents[2] / "assets" / "fonts" / "NotoNaskhArabic-Regular.ttf"


def shape_arabic(text: str) -> str:
    """Reshape and reorder Arabic for correct RTL display in images."""
    if not text.strip():
        return text
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)


def load_arabic_font(size: int = 28) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if _FONT_PATH.exists():
        return ImageFont.truetype(str(_FONT_PATH), size=size)
    logger.warning(
        "Arabic font not found at %s — PIL default bitmap font will be used. "
        "Arabic glyphs will render as tofu boxes in text-fallback preview images. "
        "Ensure backend/assets/fonts/NotoNaskhArabic-Regular.ttf is present.",
        _FONT_PATH,
    )
    return ImageFont.load_default()
