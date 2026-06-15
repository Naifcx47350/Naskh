from pathlib import Path

import arabic_reshaper
from bidi.algorithm import get_display
from PIL import ImageFont

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
    return ImageFont.load_default()
