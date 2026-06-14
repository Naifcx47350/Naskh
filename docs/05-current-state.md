# Current State

Last updated after merging the P1 work — streaming chat (PR #1), Arabic RTL (PR #2), and the frontend component split (PR #3). Use this doc to understand what is **done**, **partial**, and **not started**.

## Implementation status

| Area | Status | Notes | Completed by |
| --- | --- | --- | --- |
| File upload (PDF, PNG, JPEG, WebP) | Done | Stored under `backend/data/uploads/` | — |
| PDF/image preview generation | Done | Poppler path + pypdf fallback | — |
| Demo sample document | Done | `POST /api/documents/demo` | — |
| Vision extraction (OpenAI) | Done | Pydantic `DocumentExtraction` schema | — |
| Demo fallback without API key | Done | Sample JSON + rule-based chat | — |
| Split-view UI | Done | Original + digitized panels | — |
| Field hover → source highlight | Done | Uses `source.page` + `source.snippet` | — |
| Editable transcription | Done | Client-side textarea | — |
| Floating document assistant | Done | Always visible; opens by default | — |
| RAG chat with citations | Done | Chroma + embeddings when API key set | — |
| Export DOCX | Done | Structured fields + transcription | — |
| Export JSON | Done | Full extraction payload | — |
| Backend smoke tests | Done | 4 tests in `backend/tests/` | — |
| `run_dev.py` one-command dev | Done | Restarts stale ports on Windows | — |
| Polished UI / animations | Done | Tailwind v3, Framer Motion, hero + cards | — |
| Streaming chat responses | Done | SSE token stream; falls back to non-streaming `/chat` | Mohammed Hutatah · [#1](https://github.com/Naifcx47350/IntelliStack/pull/1) |
| Arabic RTL in UI | Done | `dir="auto"` on Arabic text; browser shapes natively | Mohammed Hutatah · [#2](https://github.com/Naifcx47350/IntelliStack/pull/2) |
| Arabic RTL in DOCX export | Done | `w:bidi` + `w:rtl` on Arabic runs/cells; right-aligned | Mohammed Hutatah · [#2](https://github.com/Naifcx47350/IntelliStack/pull/2) |
| Auth / multi-user | Out of scope | — | — |
| CI/CD pipeline | Not started | — | — |
| Component split (frontend) | Done | `App.tsx` → `types` / `lib/api` / `UploadZone` / `SplitView` / `FieldList` / `ProcessingState` / `AssistantPanel` | Mohammed Hutatah · [#3](https://github.com/Naifcx47350/IntelliStack/pull/3) |

## Verified flows

### Demo path (no API key)

1. **Load demo sample** → preview appears
2. **Process document** → sample extraction loads with note about API key
3. Hover fields → highlight on preview panel
4. Ask assistant → keyword-matched demo answer with citation
5. Export DOCX / JSON

### Live path (with API key)

Same flow; extraction and chat use OpenAI + Chroma indexing.

## Test coverage

```powershell
conda activate IntelStack
python -m pytest backend/tests -v
```

Current tests cover:

- Schema validation
- Export writers
- RAG chunking logic
- Upload + preview pipeline

There are **no** browser E2E tests or live OpenAI integration tests (would require key + cost).

## Known limitations (be honest in pitch)

1. **Handwriting quality** — Vision model first pass; operator must review Arabic transcription.
2. **PDF without Poppler** — Preview is synthesized from extracted text, not a true rasterized page.
3. **No persistence across sessions** — Documents live in local `backend/data/`; clearing data deletes work.
4. **No auth** — Anyone with network access to the server can upload/process.
5. **Single-page frontend** — All UI logic in one file; fine for MVP, refactor later.
6. **Chat latency** — Full round-trip; no streaming UX yet.

## Data that is gitignored

```
backend/data/
backend/.env
frontend/node_modules/
frontend/dist/
__pycache__/
```

Team members need to run locally and generate their own uploads/previews.

## Environment naming note

- Product: **Naskh**
- Repo folder: **IntelliStack**
- Conda env: **IntelStack**

These names appear interchangeably in docs and scripts; they refer to the same project.
