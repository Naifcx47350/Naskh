# Backend Architecture

> **Full documentation:** See [docs/08-backend-guide.md](../docs/08-backend-guide.md) and [docs/06-api-reference.md](../docs/06-api-reference.md).

The backend owns every sensitive and AI-powered operation. The frontend never receives the OpenAI key and only calls REST endpoints under `/api`.

## Runtime

- Environment: conda environment `IntelStack` with Python 3.11.
- Server: FastAPI via Uvicorn.
- Default model: `gpt-4o-mini`, configurable with `OPENAI_MODEL`.
- Embeddings: `text-embedding-3-small`, configurable with `OPENAI_EMBEDDING_MODEL`.

## Request Flow

1. `POST /api/documents/upload` stores the original file and creates normalized PNG previews.
2. `POST /api/documents/{id}/process` sends preview images to OpenAI vision with a Pydantic structured output schema.
3. The validated extraction is stored in document metadata and indexed into a per-document ChromaDB collection.
4. `POST /api/documents/{id}/chat` retrieves relevant chunks from ChromaDB and asks the model for a cited structured answer.
5. Export endpoints generate DOCX, JSON, and CSV from the validated extraction.

## Files

- `app/api.py`: FastAPI routes and error boundaries.
- `app/config.py`: environment-driven settings and local data directories.
- `app/schemas.py`: Pydantic contracts shared by AI outputs and API responses.
- `app/services/documents.py`: upload storage, preview conversion, and metadata persistence.
- `app/services/pdf_preview.py`: faithful PDF page rasterization with pypdfium2 / PyMuPDF.
- `app/services/pdf_layout.py`: text-layer source coordinates for accurate highlights.
- `app/services/samples.py`: prepared sample gallery loading.
- `app/services/ai.py`: OpenAI structured extraction and chat calls.
- `app/services/rag.py`: ChromaDB indexing and retrieval.
- `app/services/exports.py`: DOCX, JSON, and CSV export generation.
- `tests/`: smoke tests that do not require an OpenAI key.

## Demo Notes

The sample gallery is the safest no-secret demo path. Live extraction and chat require `OPENAI_API_KEY`. PDF previews rasterize with bundled Python dependencies; Poppler is optional, not required.
