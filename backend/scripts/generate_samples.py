"""Generate committed sample previews for the demo gallery. Run once from backend/."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw

from app.services.arabic_text import load_arabic_font, shape_arabic

ROOT = Path(__file__).resolve().parents[1]
SAMPLES = ROOT / "samples"


def draw_doc(title: str, lines: list[str], rtl: bool = False) -> Image.Image:
    image = Image.new("RGB", (900, 1200), color=(251, 247, 239))
    draw = ImageDraw.Draw(image)
    font_title = load_arabic_font(28)
    font_body = load_arabic_font(24)
    draw.rectangle((36, 36, 864, 1164), outline=(183, 114, 69), width=3)
    draw.text((56, 56), "Naskh sample document", fill=(23, 32, 51))
    y = 110
    header = shape_arabic(title) if rtl else title
    draw.text((844 if rtl else 56, y), header, font=font_title, fill=(23, 32, 51), anchor="ra" if rtl else "la")
    y += 60
    for line in lines:
        text = shape_arabic(line) if rtl else line
        draw.text((844 if rtl else 56, y), text, font=font_body, fill=(23, 32, 51), anchor="ra" if rtl else "la")
        y += 44
    return image


def main() -> None:
    specs = json.loads((SAMPLES / "manifest.json").read_text(encoding="utf-8"))["samples"]
    for spec in specs:
        folder = SAMPLES / spec["id"]
        folder.mkdir(parents=True, exist_ok=True)
        extraction_path = folder / "extraction.json"
        if not extraction_path.exists():
            raise FileNotFoundError(f"Missing extraction.json for {spec['id']}")
        extraction = json.loads(extraction_path.read_text(encoding="utf-8"))
        lines = [line for line in extraction["transcription"].split("\n") if line.strip()][1:8]
        rtl = "arabic" in extraction["language"].lower() or any("\u0600" <= c <= "\u06FF" for c in extraction["transcription"])
        image = draw_doc(extraction["document_kind"], lines, rtl=rtl)
        image.save(folder / "preview.png", format="PNG", optimize=True)
        print(f"Wrote {folder / 'preview.png'}")


if __name__ == "__main__":
    main()
