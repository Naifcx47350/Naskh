# Current State

Last updated after the **final polish & wow pass** (sample gallery, citation highlight loop, review layer, insights strip, exports, a11y). Use this doc to understand what is **done**, **partial**, and **not started**.

## Implementation status

| Area | Status | Notes |
| --- | --- | --- |
| File upload (PDF, PNG, JPEG, WebP) | Done | Stored under `backend/data/uploads/` |
| PDF/image preview generation | Done | pypdfium2 rasterization (Poppler optional); shaped text fallback only if rasterizers fail |
| **Sample gallery (5 docs)** | Done | `backend/samples/` — offline prepared extractions + thumbnails |
| Demo sample shortcut | Done | `POST /api/documents/demo` loads `saudi-regulatory-circular` |
| Vision extraction (OpenAI) | Done | Pydantic `DocumentExtraction` schema |
| Polished UI / animations | Done | Design tokens, dark mode, deliberate ~350ms highlight motion |
| Dark mode | Done | CSS variable themes + header toggle; paper preview stays light |
| Interactive document viewer | Done | Zoom, pagination, snippet-positioned highlight, bidirectional sync |
| **Ask → answer → highlight loop** | Done | Streaming SSE + citation resolver → viewer scroll/zoom + field emphasis |
| Assistant panel layout | Done | Fixed viewport-safe anchor; closed by default; mobile bottom sheet |
| **Suggested question chips** | Done | Generated from extracted content in assistant empty state |
| **Insights strip** | Done | Document kind, language, pages, parties/dates, summary, overall confidence |
| **Review / auditability layer** | Done | “X fields need review” banner, filter, one-click jump to source |
| **Extraction PATCH persist** | Done | `PATCH /api/documents/{id}/extraction` — transcription + fields in session |
| Floating document assistant | Done | FAB bottom-right; streaming SSE chat; “Jump to source” on citations |
| Streaming chat responses | Done | SSE token stream; honest no-citation message when ungrounded |
| Arabic RTL in UI | Done | `dir="auto"` on Arabic text; browser shapes natively |
| Arabic RTL in DOCX export | Done | Branded header, fields table, `w:bidi` / `w:rtl` on Arabic runs |
| **Branded exports** | Done | DOCX, full JSON, fields-only CSV |
| **Skeleton loaders** | Done | Viewer + fields during processing (no bare spinners) |
| **Keyboard shortcuts** | Done | `?`, Alt+T/A/P — see ShortcutsModal |
| **Accessibility / motion** | Done | Focus rings, ARIA on modals/FAB; `prefers-reduced-motion` disables big animations |
| Demo fallback without API key | Done | Gallery + prepared extractions — full UI offline |
| Auth / multi-user | Out of scope | — |
| CI/CD pipeline | Not started | — |
| **Stretch (multi-doc compare, brief export)** | Not started | Intentionally skipped — demo-locked on Sections 1–5 |

## Sample documents

Canonical location: **`backend/samples/`** (not `data/samples/` — that path was never present in the repo).

| ID | Name | Lead? | Notes |
| --- | --- | --- | --- |
| `saudi-regulatory-circular` | Regulatory Circular | **Yes** | Best wow moment — handwritten Arabic memo |
| `commercial-agreement` | Commercial Agreement | | English contract; one moderate-confidence clause |
| `compliance-notice` | Compliance Notice | | Bilingual; moderate email field |
| `arabic-tax-invoice` | Arabic Tax Invoice | | **Avoid leading** — total amount at 0.58 confidence |
| `board-resolution` | Board Resolution | | **Avoid leading** — effective date at 0.55 confidence |

Each folder contains `extraction.json` + `preview.png`. Manifest: `backend/samples/manifest.json`.

## Verified flows

### Gallery path (no API key — primary demo)

1. Open app → **sample gallery** on landing (5 cards with thumbnails)
2. Click **Regulatory Circular** → preview + fields + insights + transcription appear **instantly**
3. Hover field → highlight on viewer; click review banner → jump to flagged field + source
4. Export DOCX / JSON / CSV
5. Assistant shows suggested questions but chat requires API key (honest disabled state)

### Live path (with API key)

1. Gallery or upload → **Process document** (or chat on gallery-loaded doc after re-index if needed)
2. Ask a suggested question → streaming answer + **Jump to source** → viewer animates to cited snippet
3. Edit transcription → persists via PATCH for the session

## Test coverage

```powershell
conda activate IntelStack
cd backend
python -m pytest tests -v
```

**10 tests** — all passing. Covers:

- Schema validation, export writers (DOCX, JSON, CSV)
- RAG chunking, Arabic shaping
- Demo document + gallery sample load
- Citation source resolution
- Upload + preview pipeline

Live OpenAI integration tests are **not** included (would require key + cost). Gate any future live tests with `pytest -m integration`.

## Known limitations (be honest in pitch)

1. **Handwriting quality** — Vision model first pass; operator must review Arabic transcription and low-confidence fields.
2. **Highlight positioning** — Citation regions are approximated by matching snippet text in transcription/page context, not pixel-perfect OCR boxes.
3. **PDF preview fallback** — If all rasterizers fail, a shaped Arabic text preview is shown with a “Text preview mode” badge (rare; normal path is faithful page raster).
4. **No persistence across sessions** — Documents live in local `backend/data/`; clearing data deletes work. PATCH updates persist to disk for the current document id.
5. **No auth** — Anyone with network access to the server can upload/process.
6. **Chat without API key** — Gallery and exports work offline; assistant chat is disabled with an honest message.
7. **Prepared extractions** — Gallery samples use curated JSON; live upload quality may differ.

## Data that is gitignored

```
backend/data/
backend/.env
frontend/node_modules/
frontend/dist/
__pycache__/
```

**Committed for demo:** `backend/samples/**` (extractions, previews, manifest).

## Environment naming note

- Product: **Naskh**
- Repo folder: **IntelliStack**
- Conda env: **IntelStack**

These names appear interchangeably in docs and scripts; they refer to the same project.
