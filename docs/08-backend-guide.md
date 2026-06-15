# Backend Guide

## Stack

- **FastAPI** on **Uvicorn**
- **OpenAI Python SDK** (Responses API + `.parse()` for Pydantic outputs)
- **ChromaDB** for per-document vector index
- **Pillow**, **pypdf**, **pypdfium2**, **PyMuPDF**, **pdf2image** (optional) for document handling
- **python-docx** for exports

## File structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, router mount
│   ├── api.py               # REST routes
│   ├── config.py            # Settings from .env
│   ├── schemas.py           # Pydantic models (shared contract)
│   └── services/
│       ├── documents.py     # Upload, preview, metadata
│       ├── pdf_preview.py   # PDF rasterization (pypdfium2 / PyMuPDF / Poppler)
│       ├── pdf_layout.py    # PDF text-layer highlight coordinates
│       ├── samples.py       # Prepared sample gallery loader
│       ├── ai.py            # OpenAI extraction + chat
│       ├── rag.py           # Chunk, embed, retrieve
│       └── exports.py       # DOCX + JSON writers
├── tests/
│   ├── conftest.py
│   ├── test_document_pipeline.py
│   └── fixtures/
│       └── sample_extraction.json
├── .env.example
└── requirements.txt
```

Run from `backend/` directory so `data/` resolves correctly:

```powershell
cd backend
uvicorn app.main:app --reload
```

## Configuration

`app/config.py` loads from `backend/.env`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | `None` | Required for live AI; optional for demo |
| `OPENAI_MODEL` | `gpt-4o-mini` | Vision + chat model |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | RAG embeddings |
| `APP_NAME` | `Naskh` | Display name |

Data directories are created automatically under `backend/data/`.

## Service responsibilities

### `documents.py`

- Validates upload MIME types
- Stores original file + writes JSON metadata (`document_id`, paths, timestamps)
- Generates PNG previews:
  - Images → normalize with Pillow
  - PDF → rasterize every page with `pypdfium2` (primary), `PyMuPDF`, or `pdf2image` if Poppler is present; last-resort shaped Arabic text pages if all rasterizers fail
  - Metadata includes `preview_mode`: `raster` or `text`
- PDF metadata includes `preview_mode`: `raster` or `text`

### `ai.py`

- `extract_document(image_urls)` — sends images + prompt to OpenAI, returns `DocumentExtraction`
- `answer_question(question, excerpts)` — RAG-grounded `ChatAnswer`
- Prompts emphasize human review, Arabic preservation, and honest confidence

### `rag.py`

- Chunks transcription + field text
- Indexes into Chroma collection `doc_{document_id}`
- `retrieve(question, k)` — embedding search for chat context

### `exports.py`

- `write_docx()` — structured report with fields and transcription
- `write_json()` — serializes full `DocumentExtraction`

## API layer (`api.py`)

Central orchestration:

1. Upload/sample → `store_upload` / `load_sample_document`
2. Process → `AiService.extract_document` → `save_extraction` → `RagService.index_extraction`
3. Chat → `RagService.retrieve` + `AiService.answer_question`
4. Export → load extraction, write file, `FileResponse`

## Prepared sample path

The sample gallery is the offline-safe path:

- `GET /api/samples` lists sample metadata
- `POST /api/samples/{sample_id}/load` copies the sample PDF preview/extraction into local runtime storage
- Live extraction and assistant chat still require `OPENAI_API_KEY`

This keeps the review workflow demoable without secrets while avoiding fake AI responses.

## Tests

```powershell
cd backend
python -m pytest tests -v
```

Tests use fixtures and temp directories; they do not call OpenAI.

Adding integration tests with a real key should use env gating (`pytest -m integration`) to avoid CI cost.

## Adding a new endpoint (pattern)

1. Define request/response models in `schemas.py`
2. Implement logic in appropriate `services/*.py`
3. Add route in `api.py`
4. Wire frontend `api()` call in `App.tsx`
5. Add smoke test if behavior is non-trivial

## Security reminders

- Never expose `OPENAI_API_KEY` to the frontend
- Validate upload types and size (extend as needed)
- For any public deploy: add auth, rate limits, and virus scanning before production use
