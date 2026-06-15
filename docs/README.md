# Naskh Documentation

Concise reviewer-facing documentation for the Naskh prototype.

| Doc | Purpose |
| --- | --- |
| [01-overview.md](./01-overview.md) | Product purpose, scope, and demo path |
| [02-architecture.md](./02-architecture.md) | System design, data flow, and folder layout |
| [03-tech-stack.md](./03-tech-stack.md) | Languages, libraries, models, and environment |
| [04-getting-started.md](./04-getting-started.md) | Conda setup, env vars, and running locally |
| [05-current-state.md](./05-current-state.md) | What works today, demo path, and known gaps |
| [06-api-reference.md](./06-api-reference.md) | REST endpoints and response shapes |
| [07-frontend-guide.md](./07-frontend-guide.md) | UI structure, styling, and UX decisions |
| [08-backend-guide.md](./08-backend-guide.md) | Services, storage, AI pipeline, and tests |
| [09-roadmap.md](./09-roadmap.md) | Suggested next production steps |
| [10-demo-playbook.md](./10-demo-playbook.md) | Demo script and fallback notes |

## Quick links

- App UI (dev): `http://127.0.0.1:5173/`
- API (dev): `http://127.0.0.1:8000/`
- Health check: `http://127.0.0.1:8000/api/health`
- One-command dev launcher: `python run_dev.py` from repo root

## Repo map

```
IntelliStack/
├── backend/          FastAPI app, AI, RAG, exports, tests
├── frontend/         React + Vite + Tailwind UI
├── docs/             This documentation folder
├── run_dev.py        Starts backend + frontend together
├── environment.yml   Conda env definition (IntelStack, Python 3.11)
└── README.md         Short quick-start (links here for detail)
```
