from pydantic import BaseModel, Field


class SourceRegion(BaseModel):
    page: int = Field(description="One-based page number where the source appears.")
    snippet: str = Field(description="Exact text snippet from the source document.")


class ExtractedField(BaseModel):
    label: str
    value: str
    field_type: str = Field(
        description="A concise category such as title, party, date, clause, reference, or amount."
    )
    source: SourceRegion
    confidence: float = Field(ge=0, le=1)


class DocumentExtraction(BaseModel):
    document_kind: str
    language: str
    summary: str
    transcription: str = Field(
        description="Clean editable text. Preserve Arabic paragraph and line structure when present."
    )
    fields: list[ExtractedField]
    notes: list[str] = Field(
        description="Uncertainties, low confidence regions, or human review recommendations."
    )


class ChatAnswer(BaseModel):
    answer: str
    source_snippets: list[SourceRegion]


class UploadResponse(BaseModel):
    document_id: str
    filename: str
    content_type: str
    preview_urls: list[str]
    extraction: DocumentExtraction | None = None


class ProcessResponse(BaseModel):
    document_id: str
    extraction: DocumentExtraction


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    document_id: str
    answer: ChatAnswer


class SampleInfo(BaseModel):
    id: str
    name: str
    description: str
    pitch_priority: int = 99
    recommended_lead: bool = False
    thumbnail_url: str


class ExtractionUpdate(BaseModel):
    transcription: str | None = None
    fields: list[ExtractedField] | None = None
