# Getting Started

## Prerequisites

- [Conda](https://docs.conda.io/) (Miniconda or Anaconda)
- Git
- Windows, macOS, or Linux (dev scripts tested on Windows)

## 1. Clone and create environment

```powershell
git clone <repo-url>
cd IntelliStack
conda env create -f environment.yml
conda activate IntelStack
```

The conda env name is **`IntelStack`**. Your local shell may show a different casing (e.g. `intelStack`); either works if it points to the same env.

## 2. Install dependencies

```powershell
pip install -r backend\requirements.txt
cd frontend
npm install
cd ..
```

Or let the launcher install for you:

```powershell
python run_dev.py --install
```

## 3. Configure backend

```powershell
Copy-Item backend\.env.example backend\.env
```

Edit `backend/.env`:

```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

**Demo without API key:** Leave `OPENAI_API_KEY` empty. The app uses bundled sample extraction and rule-based demo chat. Good for UI testing; not for live AI judging.

## 4. Run the app

From repo root:

```powershell
python run_dev.py
```

This will:

1. Kill any process already listening on ports **8000** and **5173** (Windows: `netstat` + `taskkill`)
2. Start FastAPI on `http://127.0.0.1:8000`
3. Start Vite on `http://127.0.0.1:5173`
4. Open the browser to the frontend

### Launcher flags

| Flag | Effect |
| --- | --- |
| `--install` | Reinstall pip + npm deps before start |
| `--no-browser` | Do not open a browser tab |
| `--no-restart` | Do not kill existing processes on 8000/5173 |

## 5. Verify

| Check | URL / command |
| --- | --- |
| API health | `http://127.0.0.1:8000/api/health` → `{"status":"ok"}` |
| Frontend UI | `http://127.0.0.1:5173/` |
| Backend tests | `python -m pytest backend/tests` |

## Manual start (two terminals)

**Terminal 1 — backend:**

```powershell
cd backend
conda activate IntelStack
uvicorn app.main:app --reload
```

**Terminal 2 — frontend:**

```powershell
cd frontend
npm run dev
```

If only the backend is running, visiting `http://127.0.0.1:8000/` shows a landing page explaining that the UI lives on port **5173**.

## Common issues

### UI looks unstyled or broken

Usually a **stale Vite dev server** serving old CSS. Fix:

```powershell
python run_dev.py
```

Hard refresh the browser: **Ctrl+F5**. After a clean restart, compiled CSS should be ~20–35 KB (Tailwind v3 utilities present).

### PDF preview is text-only, not a scan image

Poppler is not installed. Options:

- Install Poppler for Windows and ensure it is on `PATH`
- Upload a PNG/JPEG photo instead for the demo
- Accept the text-rendered fallback preview (upload still works)

### `Process document` fails

- Check `backend/.env` has a valid `OPENAI_API_KEY`
- Or use **Load demo sample** + process without a key

### Port already in use

```powershell
python run_dev.py
```

By default it restarts ports. Use `--no-restart` only if you intentionally want to keep existing servers.

### Frontend cannot reach API

In dev, leave `VITE_API_BASE` unset so Vite proxies `/api` to the backend. If running frontend against a remote API, set:

```env
VITE_API_BASE=http://your-backend:8000
```

## Production build (frontend only)

```powershell
cd frontend
npm run build
npm run preview
```

Backend still runs separately via Uvicorn. There is no unified production deploy script in the MVP.
