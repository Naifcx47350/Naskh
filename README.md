# IntelliStack / Naskh

Naskh is a hackathon MVP for human-in-the-loop document intelligence. It uploads a PDF or document photo, sends page previews to a server-side OpenAI vision model for structured extraction and Arabic transcription, indexes the result in ChromaDB, and exposes a floating document assistant with cited answers.

## Documentation

Full team docs live in **[docs/](./docs/README.md)** — architecture, tech stack, API reference, current state, roadmap, and demo playbook.

## Stack

- Backend: FastAPI, OpenAI Python SDK, Pydantic structured outputs, ChromaDB, Pillow, pdf2image, python-docx.
- Frontend: React, Vite, Tailwind CSS.
- AI keys stay on the backend. The browser only calls the FastAPI REST API.

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

## Manual Backend Setup

```powershell
cd backend
conda activate IntelStack
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

Manual backend setup only starts the API on `http://127.0.0.1:8000/`. The actual app UI is the Vite frontend on `http://127.0.0.1:5173/`.

Set these values in `backend/.env`:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

The default model is `gpt-4o-mini` to keep the demo cost lower while preserving vision and structured-output support. Use `gpt-4o` for a stronger live demo pass if quality matters more than cost. Avoid `3.5` for the main extraction path because it does not cover the image understanding requirement.

PDF preview conversion uses `pdf2image`, which requires Poppler on Windows. For the fastest demo path, upload a clear PNG/JPEG photo if Poppler is not installed.

## Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

Optional frontend environment:

```env
VITE_API_BASE=http://localhost:8000
```

## Demo Flow

1. Upload one prepared printed document or handwritten Arabic photo.
2. Confirm the preview appears.
3. Click `Process document`.
4. Hover fields in the result panel to show the cited source highlight.
5. Ask the floating assistant a question about the document.
6. Export `.docx` or JSON.

## Scope Notes

This project intentionally does not add auth, accounts, payments, government integrations, or broad document-type support. It frames Arabic handwriting as an AI first pass with human review rather than a fully solved OCR system.