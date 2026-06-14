# Naskh / IntelliStack — Team Documentation

This folder is the onboarding source for the current hackathon MVP. Read these docs in order if you are new to the project.

| Doc | Purpose |
| --- | --- |
| [01-overview.md](./01-overview.md) | What we are building, positioning, and judging goals |
| [02-architecture.md](./02-architecture.md) | System design, data flow, and folder layout |
| [03-tech-stack.md](./03-tech-stack.md) | Languages, libraries, models, and environment |
| [04-getting-started.md](./04-getting-started.md) | Conda setup, env vars, and running locally |
| [05-current-state.md](./05-current-state.md) | What works today, demo path, and known gaps |
| [06-api-reference.md](./06-api-reference.md) | REST endpoints and response shapes |
| [07-frontend-guide.md](./07-frontend-guide.md) | UI structure, styling, and UX decisions |
| [08-backend-guide.md](./08-backend-guide.md) | Services, storage, AI pipeline, and tests |
| [09-roadmap.md](./09-roadmap.md) | Next steps, enhancements, and pitch priorities |
| [10-demo-playbook.md](./10-demo-playbook.md) | Live demo script, backup path, and judge Q&A |

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
