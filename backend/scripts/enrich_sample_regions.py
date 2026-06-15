"""Add PDF highlight regions to all sample extraction.json files."""
from __future__ import annotations

import json
from pathlib import Path

from app.services.pdf_layout import enrich_extraction_regions, locate_snippet_in_pdf
from app.services.samples import SAMPLES_DIR, resolve_sample_pdf, _manifest
from app.schemas import DocumentExtraction

for entry in _manifest():
    sample_id = entry["id"]
    pdf_path = resolve_sample_pdf(sample_id)
    extraction_path = SAMPLES_DIR / sample_id / "extraction.json"
    extraction = DocumentExtraction.model_validate(json.loads(extraction_path.read_text(encoding="utf-8")))
    enriched = enrich_extraction_regions(extraction, pdf_path)
    extraction_path.write_text(enriched.model_dump_json(indent=2), encoding="utf-8")
    ref = enriched.fields[0]
    region = ref.source.region
    print(sample_id, ref.label, region.model_dump() if region else None)
