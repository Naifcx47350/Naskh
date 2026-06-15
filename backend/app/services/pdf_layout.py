from __future__ import annotations

import re
import unicodedata
from pathlib import Path

from app.schemas import DocumentExtraction, NormalizedRegion, SourceRegion


def _normalize_match(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text


def _pick_best_rect(rects: list) -> object | None:
    if not rects:
        return None
    if len(rects) == 1:
        return rects[0]
    sorted_rects = sorted(rects, key=lambda r: (r.y0, r.x0))
    top_y = sorted_rects[0].y0
    same_line = [r for r in rects if abs(r.y0 - top_y) < 10]
    if len(same_line) > 1:
        return max(same_line, key=lambda r: r.x0)
    return min(rects, key=lambda r: (r.y1 - r.y0) * (r.x1 - r.x0))


def _union_rects(rects: list) -> tuple[float, float, float, float] | None:
    if not rects:
        return None
    chosen = _pick_best_rect(rects)
    if chosen is None:
        return None
    return chosen.x0, chosen.y0, chosen.x1, chosen.y1


def _to_normalized(page, rect) -> NormalizedRegion:
    width = page.rect.width
    height = page.rect.height
    pad_x = width * 0.008
    pad_y = height * 0.006
    x0 = max(0.0, rect.x0 - pad_x)
    y0 = max(0.0, rect.y0 - pad_y)
    x1 = min(width, rect.x1 + pad_x)
    y1 = min(height, rect.y1 + pad_y)
    return NormalizedRegion(
        x=x0 / width,
        y=y0 / height,
        width=max(0.01, (x1 - x0) / width),
        height=max(0.01, (y1 - y0) / height),
        approximate=False,
    )


def _search_page(page, query: str) -> list:
    import fitz

    if not query.strip():
        return []
    rects = page.search_for(query.strip())
    if rects:
        return rects
    compact = re.sub(r"\s+", "", query)
    if compact and compact != query:
        rects = page.search_for(compact)
        if rects:
            return rects
    words = query.split()
    if len(words) >= 2:
        for size in (min(6, len(words)), min(4, len(words)), 2):
            partial = " ".join(words[:size])
            rects = page.search_for(partial)
            if rects:
                return rects
    return []


def _best_word_line_match(page, query: str) -> tuple | None:
    import fitz

    target = _normalize_match(query)
    if not target:
        return None
    best: tuple[float, fitz.Rect] | None = None
    blocks = page.get_text("dict").get("blocks", [])
    for block in blocks:
        for line in block.get("lines", []):
            parts = [span.get("text", "") for span in line.get("spans", [])]
            line_text = _normalize_match(" ".join(parts))
            if not line_text:
                continue
            score = 0.0
            if target in line_text or line_text in target:
                score = 1.0
            else:
                target_tokens = set(target.split())
                line_tokens = set(line_text.split())
                if target_tokens and line_tokens:
                    score = len(target_tokens & line_tokens) / len(target_tokens)
            if score >= 0.45 and (best is None or score > best[0]):
                bbox = line.get("bbox")
                if bbox:
                    best = (score, fitz.Rect(bbox))
    return best[1] if best else None


def locate_snippet_in_pdf(
    pdf_path: Path,
    page_number: int,
    snippet: str,
    *,
    value: str = "",
) -> NormalizedRegion | None:
    import fitz

    if not pdf_path.exists() or not snippet.strip():
        return None

    doc = fitz.open(pdf_path)
    try:
        index = max(0, min(page_number - 1, len(doc) - 1))
        page = doc[index]
        queries = [snippet.strip()]
        if value.strip() and value.strip() not in queries:
            queries.append(value.strip())

        for query in queries:
            rects = _search_page(page, query)
            if rects:
                union = _union_rects(rects)
                if union:
                    return _to_normalized(page, fitz.Rect(union))

        for query in queries:
            rect = _best_word_line_match(page, query)
            if rect:
                region = _to_normalized(page, rect)
                region.approximate = True
                return region

        return None
    finally:
        doc.close()


def enrich_extraction_regions(extraction: DocumentExtraction, pdf_path: Path | None) -> DocumentExtraction:
    if pdf_path is None or not pdf_path.exists() or pdf_path.suffix.lower() != ".pdf":
        return extraction

    updated_fields = []
    for field in extraction.fields:
        source = field.source.model_copy(deep=True)
        region = locate_snippet_in_pdf(
            pdf_path,
            source.page,
            source.snippet,
            value=field.value,
        )
        if region:
            source.region = region
        elif source.page >= 1:
            source.region = NormalizedRegion(
                x=0.04,
                y=0.04,
                width=0.92,
                height=0.06,
                approximate=True,
            )
        updated_fields.append(field.model_copy(update={"source": source}))

    return extraction.model_copy(update={"fields": updated_fields})
