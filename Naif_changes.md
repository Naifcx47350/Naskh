# Naif — Naskh update summary (team handoff)

This document lists **everything added and edited** during the frontend transformation and final polish passes. Use it with the numbered commits pushed to `main` and the detailed docs in `docs/`.

**Product:** Naskh (repo folder: IntelliStack)  
**Branch:** `main`  
**Date:** June 2025  
**Status:** Demo-locked MVP — gallery-first offline demo + live AI path

---

## What changed at a glance

| Before | After |
| --- | --- |
| Single “Load demo sample” button | **5-card sample gallery** — instant offline load |
| Light-only UI, assistant clipped | **Dark/light themes**, fixed assistant, mobile bottom sheet |
| Static preview image | **Interactive DocumentViewer** — zoom, pages, animated highlights |
| Field hover only | **Ask → stream → Jump to source** — bidirectional citation loop |
| Per-field confidence only | **Review banner**, filter, one-click jump to flagged fields |
| Basic processed view | **Insights strip** — kind, language, summary, overall confidence |
| Spinners | **Skeleton loaders** during processing |
| DOCX + JSON exports | **Branded DOCX**, full JSON, **fields-only CSV** |
| Fake AI when no API key | **Honest** offline gallery; chat disabled without key |

---

## New files

### Backend

| Path | Purpose |
| --- | --- |
| `backend/app/services/arabic_text.py` | Arabic RTL shaping for Pillow preview generation |
| `backend/app/services/citations.py` | Maps RAG chat excerpts → field `source` snippets for accurate highlights |
| `backend/app/services/samples.py` | List/load gallery samples, serve thumbnails |
| `backend/scripts/generate_samples.py` | Regenerate `preview.png` from `extraction.json` (run from `backend/`: `python -m scripts.generate_samples`) |
| `backend/scripts/__init__.py` | Package marker for scripts module |
| `backend/assets/fonts/NotoNaskhArabic-Regular.ttf` | Font for Arabic sample preview images |
| `backend/samples/manifest.json` | Gallery metadata (5 samples, lead = `saudi-regulatory-circular`) |
| `backend/samples/*/extraction.json` | Prepared extractions (offline demo — no OpenAI) |
| `backend/samples/*/preview.png` | Gallery thumbnails / viewer previews |

### Frontend

| Path | Purpose |
| --- | --- |
| `frontend/src/components/DocumentViewer.tsx` | Zoom, pagination, snippet-positioned highlight (~350ms) |
| `frontend/src/components/SampleGallery.tsx` | Landing gallery — 5 cards with thumbnails |
| `frontend/src/components/InsightsStrip.tsx` | Document intelligence summary card |
| `frontend/src/components/ReviewBanner.tsx` | “X fields need review”, filter, jump to first |
| `frontend/src/components/Skeletons.tsx` | Viewer/field loading placeholders |
| `frontend/src/components/ShortcutsModal.tsx` | Keyboard shortcuts help (`?`) |
| `frontend/src/components/ThemeToggle.tsx` | Header sun/moon toggle |
| `frontend/src/components/Toast.tsx` | Dismissible error toasts |
| `frontend/src/hooks/useTheme.ts` | Theme persistence (`localStorage` key `naskh-theme`) |
| `frontend/src/hooks/useReducedMotion.ts` | Honors `prefers-reduced-motion` |
| `frontend/src/hooks/useKeyboardShortcuts.ts` | `?`, Alt+T/A/P |
| `frontend/src/lib/documentIntel.ts` | Review thresholds, suggested questions, snippet matching |

### Docs

| Path | Purpose |
| --- | --- |
| `docs/11-implementation-changes.md` | Frontend transformation + final polish changelogs |
| `Naif_changes.md` | This file — team handoff summary |

---

## Modified files

### Backend

| Path | Changes |
| --- | --- |
| `backend/app/api.py` | `GET/POST /api/samples/*`, citation resolver in chat, `PATCH .../extraction`, `GET .../export/csv`, demo loads regulatory circular |
| `backend/app/schemas.py` | `SampleInfo`, `ExtractionUpdate` |
| `backend/app/config.py` | Default `openai_model = gpt-4o-mini` |
| `backend/.env.example` | `gpt-4o-mini` default + note to use `gpt-4o` for live demo |
| `backend/app/services/ai.py` | Honest behavior — no fake extraction when API key missing |
| `backend/app/services/documents.py` | Sample load integration, extraction persist helpers |
| `backend/app/services/exports.py` | Branded DOCX header, fields table, `write_csv()` |
| `backend/tests/test_document_pipeline.py` | 10 tests — gallery, citations, CSV, demo route |

### Frontend

| Path | Changes |
| --- | --- |
| `frontend/src/App.tsx` | Gallery primary path, citation focus state, PATCH persist, shortcuts |
| `frontend/src/components/AssistantPanel.tsx` | Suggested chips, Jump to source, streaming, honest no-citation |
| `frontend/src/components/FieldList.tsx` | Confidence badges, review filter, amber review styling |
| `frontend/src/components/SplitView.tsx` | Insights, review banner, skeletons, CSV export link |
| `frontend/src/components/UploadZone.tsx` | Themed styling; secondary to gallery |
| `frontend/src/components/ProcessingState.tsx` | Themed stepper copy |
| `frontend/src/main.tsx` | `initTheme()` on boot |
| `frontend/src/styles.css` | Full design token layer, gallery, insights, review, skeleton, modal styles |
| `frontend/src/types.ts` | `SampleInfo`, citation types |
| `frontend/tailwind.config.js` | `darkMode: "class"`, token-aligned palette |

### Root & docs

| Path | Changes |
| --- | --- |
| `README.md` | Gallery-first demo flow, model defaults |
| `docs/05-current-state.md` | Full status table, sample quality notes, test count |
| `docs/07-frontend-guide.md` | Gallery, insights, review, shortcuts, a11y |
| `docs/10-demo-playbook.md` | Gallery-first script, API fallback, gauntlet checklist |
| `docs/03-tech-stack.md`, `04-getting-started.md`, `06-api-reference.md`, `08-backend-guide.md`, `09-roadmap.md`, `docs/README.md` | Aligned with new routes and demo path |

---

## Sample gallery (demo backbone)

**Location:** `backend/samples/` (not `data/samples/` — root `data/` is gitignored)

| ID | Name | Demo note |
| --- | --- | --- |
| `saudi-regulatory-circular` | Regulatory Circular | **Lead demo** — best wow moment |
| `commercial-agreement` | Commercial Agreement | English contract |
| `compliance-notice` | Compliance Notice | Bilingual |
| `arabic-tax-invoice` | Arabic Tax Invoice | Avoid leading — low confidence on total (~0.58) |
| `board-resolution` | Board Resolution | Avoid leading — low confidence on date (~0.55) |

---

## New API routes (summary)

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/samples` | Gallery list |
| GET | `/api/samples/{id}/thumbnail` | Card thumbnail |
| POST | `/api/samples/{id}/load` | Load prepared sample into workspace |
| PATCH | `/api/documents/{id}/extraction` | Persist transcription/field edits |
| GET | `/api/documents/{id}/export/csv` | Fields-only CSV download |

Chat streaming unchanged: `POST /api/documents/{id}/chat/stream` — now returns resolved `source_snippets`.

---

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `?` | Show shortcuts modal |
| `Alt+T` | Toggle theme |
| `Alt+A` | Toggle assistant |
| `Alt+P` | Process document |

---

## How to run & verify

```powershell
conda activate IntelStack
python run_dev.py
# Browser: http://127.0.0.1:5173/ — Ctrl+F5 hard refresh
```

**Offline demo (no API key):** Gallery → any sample → fields, insights, review, exports.  
**Live demo (API key in `backend/.env`):** Suggested question → stream → Jump to source.

**Tests:**

```powershell
cd backend
python -m pytest tests -v   # 10 passed
```

```powershell
cd frontend
npm run build               # CSS ~28 KB confirms Tailwind compiled
```

---

## Commit map (10 commits on `main`)

1. `feat(backend): add Arabic text shaping and Noto Naskh font`
2. `feat(backend): add offline sample gallery with prepared extractions`
3. `feat(backend): extend API for gallery, citations, and extraction PATCH`
4. `feat(backend): improve DOCX/CSV exports and expand test coverage`
5. `feat(frontend): add design system with dark mode and CSS tokens`
6. `feat(frontend): add interactive DocumentViewer with highlight sync`
7. `feat(frontend): add sample gallery, insights strip, and review layer`
8. `feat(frontend): wire citation loop, assistant, and workspace orchestration`
9. `docs: update guides, playbook, and implementation changelog`
10. `docs: add Naif_changes team handoff summary`

---

## Intentionally not done (stretch / future)

- Multi-document compare view
- Regulatory diff between two versions
- One-page “export brief” DOCX
- Browser E2E (Playwright)
- CI pipeline
- Auth / multi-user

---

## Guardrails preserved

- Tailwind **v3.4** (not v4)
- OpenAI API key **server-side only**
- File-based storage under `backend/data/` (gitignored)
- Honest first-pass positioning for handwriting / OCR
- No secrets or `backend/data/` committed
- Dark mode, assistant layout, and interactive viewer not regressed

---

## Questions?

See `docs/10-demo-playbook.md` for the 10-minute judge script and `docs/05-current-state.md` for limitations to cite honestly in the pitch.
