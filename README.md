# Naskh

Naskh is a human-in-the-loop document intelligence prototype for Arabic and bilingual business documents. It turns PDFs or document photos into structured fields, editable transcription, cited source highlights, and exportable review artifacts.

The project is intentionally scoped as an honest first-pass assistant: AI extracts and cites, while a human reviews low-confidence fields before export.

## Highlights

- PDF and image upload with faithful PDF page previews (`pypdfium2`, PyMuPDF fallback)
- Five bundled sample PDFs with prepared extractions for a reliable offline demo path
- Structured extraction with confidence and review indicators
- Source-linked document viewer with field/citation highlights
- Floating document assistant with cited answers when an OpenAI key is configured
- Exports: DOCX, JSON, and CSV
- Dark mode, responsive layout, keyboard shortcuts, and reduced-motion support

## Stack

- Backend: FastAPI, OpenAI Python SDK, Pydantic, ChromaDB, Pillow, pypdfium2, PyMuPDF, python-docx
- Frontend: React, Vite, TypeScript, Tailwind CSS v3.4, Framer Motion
- Storage: local files under `backend/data/` (gitignored)
- Security: OpenAI keys stay server-side in `backend/.env`

## Quick Start

```powershell
conda activate IntelStack
pip install -r backend\requirements.txt
cd frontend
npm install
cd ..
Copy-Item backend\.env.example backend\.env
python run_dev.py
```

If the environment does not exist yet, create it with:

```powershell
conda env create -f environment.yml
conda activate IntelStack
```

`run_dev.py` starts both servers, waits for readiness, and opens `http://127.0.0.1:5173/`. Use `python run_dev.py --install` to reinstall Python and npm dependencies before launch, or `python run_dev.py --no-browser` to keep it from opening a browser tab.

If you already started the backend manually from `backend/`, return to the project root and run `python run_dev.py`; it will reuse the running backend and start the missing frontend.

Open the UI at `http://127.0.0.1:5173/`. The API runs at `http://127.0.0.1:8000/`.

## Configuration

Copy `backend/.env.example` to `backend/.env`:

```powershell
Copy-Item backend\.env.example backend\.env
```

Set these values in `backend/.env`:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_CHAT_MODEL=
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

`OPENAI_API_KEY` is required for live extraction and assistant chat. The sample gallery loads prepared extractions without a key.

Default model is `gpt-4o-mini` to control cost. Use `gpt-4o` for a final quality rehearsal if needed.

## Demo Flow

1. Start the app with `python run_dev.py`.
2. Pick a bundled document from the sample strip below the upload zone.
3. Review fields, confidence badges, and source highlights.
4. Open the assistant with `Ctrl+K` and ask a question if an API key is configured.
5. Export DOCX, JSON, or CSV.

For live AI, upload a PDF/PNG/JPEG and click **Process with AI**. Bundled samples load prepared extractions without calling OpenAI.

## Useful Docs

- [Architecture](./docs/02-architecture.md)
- [Tech stack](./docs/03-tech-stack.md)
- [API reference](./docs/06-api-reference.md)
- [Frontend guide](./docs/07-frontend-guide.md)
- [Backend guide](./docs/08-backend-guide.md)
- [Demo playbook](./docs/10-demo-playbook.md)

## Scope Notes

This prototype does not include auth, accounts, payments, government integrations, or production OCR guarantees. It frames Arabic handwriting and scan extraction as an AI first pass with human review.