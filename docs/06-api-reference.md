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
  "preview_urls": ["/api/documents/abc123.../previews/page-1.png"],
  "preview_mode": "raster"
}
```

**Errors:** `400` — invalid file type or processing failure

---

### `POST /api/documents/demo`

Load the recommended prepared sample document.

**Response:** Same shape as upload.

---

### `GET /api/documents/{document_id}/previews/{filename}`

Returns PNG preview image bytes.

**Errors:** `404` — document or preview not found

---

## Samples

### `GET /api/samples`

Returns the prepared sample gallery metadata.

### `GET /api/samples/{sample_id}/thumbnail`

Returns a sample thumbnail PNG.

### `POST /api/samples/{sample_id}/load`

Loads a prepared sample document and extraction. This path does not require an OpenAI key.

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
        "source": {
          "page": 1,
          "snippet": "...",
          "region": { "x": 0.1, "y": 0.2, "width": 0.3, "height": 0.05, "approximate": false }
        },
        "confidence": 0.92
      }
    ],
    "notes": ["..."]
  }
}
```

Requires `OPENAI_API_KEY`; prepared samples are the offline path.

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

- Requires `OPENAI_API_KEY`
- Uses RAG retrieval + structured chat answer

**Prerequisite:** Document must have a saved extraction (prepared sample or processed upload).

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
