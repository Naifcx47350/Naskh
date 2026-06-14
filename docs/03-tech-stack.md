# Tech Stack

## Summary

| Layer | Technology |
| --- | --- |
| Backend runtime | Python 3.11 (Conda env `IntelStack`) |
| API framework | FastAPI + Uvicorn |
| AI provider | OpenAI (Responses API, structured outputs) |
| Vector store | ChromaDB (local persistent) |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v3.4 + custom `naskh-*` classes |
| Animation | Framer Motion |
| File upload | react-dropzone |
| Icons | lucide-react |

## Backend dependencies

From `backend/requirements.txt`:

| Package | Purpose |
| --- | --- |
| `fastapi` | REST API |
| `uvicorn[standard]` | ASGI server |
| `python-multipart` | File upload parsing |
| `openai` | Vision extraction, chat, embeddings |
| `pydantic-settings` | Config from `.env` |
| `Pillow` | Image normalization and preview fallback |
| `pypdf` | PDF text extraction when Poppler unavailable |
| `pdf2image` | High-quality PDF → PNG (requires Poppler) |
| `python-docx` | DOCX export |
| `chromadb` | Per-document RAG index |
| `arabic-reshaper` + `python-bidi` | RTL shaping for exports (available, not yet wired in UI) |
| `pytest` | Backend smoke tests |

## Frontend dependencies

From `frontend/package.json`:

| Package | Purpose |
| --- | --- |
| `react` / `react-dom` | UI |
| `vite` + `@vitejs/plugin-react` | Dev server and build |
| `typescript` | Type safety |
| `tailwindcss` v3.4 | Utility CSS (locked — do not upgrade to v4 without testing) |
| `framer-motion` | Page transitions, assistant bubble, processing states |
| `react-dropzone` | Drag-and-drop upload |
| `lucide-react` | Icons |

## AI models

Configured in `backend/.env`:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

| Setting | Default | Notes |
| --- | --- | --- |
| `OPENAI_MODEL` | `gpt-4o-mini` | Vision + structured outputs; cost-effective for hackathon |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | RAG chunk retrieval |
| Upgrade path | `gpt-4o` | Use for stronger live demo if budget allows |

**Do not use GPT-3.5** for the main extraction path — it does not meet the vision requirement.

## Development tooling

| Tool | Location | Purpose |
| --- | --- | --- |
| `run_dev.py` | Repo root | Starts backend + frontend, kills stale ports on Windows |
| `environment.yml` | Repo root | Conda env with Python 3.11 + Node.js |
| Vite proxy | `frontend/vite.config.ts` | Forwards `/api` → `http://127.0.0.1:8000` |

## Optional system dependencies

| Dependency | When needed |
| --- | --- |
| Poppler | Best PDF preview quality via `pdf2image` on Windows |
| Conda | Recommended env management per `environment.yml` |

Without Poppler, PDF uploads still work using the `pypdf` + Pillow text preview fallback.

## What is intentionally not in the stack

- No PostgreSQL / Redis / S3 (file-based MVP)
- No auth provider (OAuth, JWT)
- No separate OCR engine (Tesseract, Azure Document Intelligence)
- No Docker / Kubernetes (local dev only for hackathon)
