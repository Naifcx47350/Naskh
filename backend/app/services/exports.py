import json
from pathlib import Path

from docx import Document

from app.config import get_settings
from app.schemas import DocumentExtraction


def write_docx(document_id: str, extraction: DocumentExtraction) -> Path:
    output_path = get_settings().data_dir / "exports" / f"{document_id}.docx"
    doc = Document()
    doc.add_heading("Naskh Digitized Document", level=1)
    doc.add_paragraph(extraction.summary)

    if extraction.transcription:
        doc.add_heading("Editable Transcription", level=2)
        doc.add_paragraph(extraction.transcription)

    if extraction.fields:
        doc.add_heading("Structured Fields", level=2)
        table = doc.add_table(rows=1, cols=4)
        header = table.rows[0].cells
        header[0].text = "Field"
        header[1].text = "Value"
        header[2].text = "Source"
        header[3].text = "Confidence"

        for field in extraction.fields:
            row = table.add_row().cells
            row[0].text = field.label
            row[1].text = field.value
            row[2].text = field.source.snippet
            row[3].text = f"{field.confidence:.0%}"

    if extraction.notes:
        doc.add_heading("Human Review Notes", level=2)
        for note in extraction.notes:
            doc.add_paragraph(note, style="List Bullet")

    doc.save(output_path)
    return output_path


def write_json(document_id: str, extraction: DocumentExtraction) -> Path:
    output_path = get_settings().data_dir / "exports" / f"{document_id}.json"
    output_path.write_text(
        json.dumps(extraction.model_dump(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return output_path
