# API Reference

Base URL (dev): `http://127.0.0.1:8000`

All routes are prefixed with `/api`. The Vite dev server proxies `/api/*` to the backend.

Interactive docs: `http://127.0.0.1:8000/docs` (FastAPI Swagger UI)

## Health

### `GET /api/health`

**Response:**

```json
{ "status": "ok" }
```

---

## Documents

### `POST /api/documents/upload`

Upload a PDF or image.

**Request:** `multipart/form-data` with field `file`

**Response:** `UploadResponse`

```json
{
  "document_id": "abc123...",
  "filename": "contract.pdf",
  "content_type": "application/pdf",
  "preview_urls": ["/api/documents/abc123.../previews/page-1.png"]
}
```

**Errors:** `400` — invalid file type or processing failure

---

### `POST /api/documents/demo`

Create a demo document from bundled sample assets (no upload required).

**Response:** Same shape as upload.

---

### `GET /api/documents/{document_id}/previews/{filename}`

Returns PNG preview image bytes.

**Errors:** `404` — document or preview not found

---

### `POST /api/documents/{document_id}/process`

Run vision extraction on document previews.

**Response:** `ProcessResponse`

```json
{
  "document_id": "abc123...",
  "extraction": {
    "document_kind": "regulatory circular",
    "language": "ar",
    "summary": "...",
    "transcription": "...",
    "fields": [
      {
        "label": "Document title",
        "value": "...",
        "field_type": "title",
        "source": { "page": 1, "snippet": "..." },
        "confidence": 0.92
      }
    ],
    "notes": ["..."]
  }
}
```

**Behavior:**

- With `OPENAI_API_KEY`: live OpenAI vision extraction + Chroma indexing
- Without key: loads `backend/tests/fixtures/sample_extraction.json`

**Errors:** `404` document not found, `400` processing error

---

### `POST /api/documents/{document_id}/chat`

Ask a question about the processed document.

**Request body:**

```json
{ "question": "What is the document title?" }
```

**Response:** `ChatResponse`

```json
{
  "document_id": "abc123...",
  "answer": {
    "answer": "The document title is ...",
    "source_snippets": [
      { "page": 1, "snippet": "..." }
    ]
  }
}
```

**Behavior:**

- With API key: RAG retrieval + structured chat answer
- Without key: `_demo_chat_answer()` keyword matching on extraction fields

**Prerequisite:** Document must be processed first (`extraction` saved in metadata).

---

### `GET /api/documents/{document_id}/export/docx`

Download Word export.

**Response:** File download `naskh-{document_id}.docx`

---

### `GET /api/documents/{document_id}/export/json`

Download JSON export of full extraction.

**Response:** File download `naskh-{document_id}.json`

---

## Shared schemas

Defined in `backend/app/schemas.py`:

| Model | Fields |
| --- | --- |
| `SourceRegion` | `page`, `snippet` |
| `ExtractedField` | `label`, `value`, `field_type`, `source`, `confidence` |
| `DocumentExtraction` | `document_kind`, `language`, `summary`, `transcription`, `fields`, `notes` |
| `ChatAnswer` | `answer`, `source_snippets` |
| `ChatRequest` | `question` |

## Example curl sequence

```powershell
# Health
curl http://127.0.0.1:8000/api/health

# Demo document
curl -X POST http://127.0.0.1:8000/api/documents/demo

# Process (replace ID)
curl -X POST http://127.0.0.1:8000/api/documents/{id}/process

# Chat
curl -X POST http://127.0.0.1:8000/api/documents/{id}/chat `
  -H "Content-Type: application/json" `
  -d '{"question":"What is the document title?"}'
```
