# Frontend transformation — change log

This section documents the **frontend-only visual overhaul** pass (dark mode, design system, assistant layout fix, interactive document viewer).

## What changed visually

| Area | Before | After |
| --- | --- | --- |
| Theme | Fixed cream/light palette only | Light + dark themes with CSS variable tokens; sun/moon toggle in header |
| Hero & cards | Flat white/cream cards, hard-coded hex | Token-driven surfaces, refined depth, section labels, cohesive typography |
| Assistant | Open by default; clipped off right edge; overlapped output | Closed by default; fixed bottom-right anchor; viewport-safe width; main content gets right padding when open on desktop; mobile bottom-sheet + backdrop |
| Document preview | Faded static image + text overlay | Interactive `DocumentViewer`: zoom, pagination, info strip, animated highlight sync, paper surface stays light in both themes |
| Field confidence | Orange progress bars only | Badge (High / Moderate / Review recommended) + subtle confidence bar |
| Errors | Inline red box in page flow | Toast notification (dismissible) |
| States | Basic placeholders | Themed empty, processing stepper, processed reveal animation |

## Theme token system

Defined in `frontend/src/styles.css` on `:root` and `html.dark`:

- `--bg`, `--bg-elevated`, `--surface`, `--border`, `--text`, `--text-muted`, `--primary`, `--accent`, `--success`, `--warn`, `--ring`
- `--paper` / `--paper-border` — document preview only (stays light in dark mode)

Initialization: `initTheme()` in `main.tsx` reads `localStorage` key `naskh-theme`, else `prefers-color-scheme`. Toggle: `frontend/src/components/ThemeToggle.tsx` + `hooks/useTheme.ts`.

All `naskh-*` component classes consume CSS variables — no hard-coded cream/white in components.

## Assistant layout fix

- Root: `.naskh-assistant-root` — `position: fixed; bottom: 1.5rem; right: 1.5rem; width: min(380px, calc(100vw - 2rem))`
- Panel: `max-height: min(70vh, 560px)` with internal scroll; opens **closed** by default
- FAB stays anchored; panel animates above it without shifting the button
- `@media (max-width: 768px)`: full-width bottom sheet, dimmed backdrop tap-to-close
- When open on `lg+`, `.naskh-container-assistant-open` adds right padding so split-view content stays readable

## New / updated components

| File | Role |
| --- | --- |
| `components/DocumentViewer.tsx` | Zoom, page nav, metadata strip, highlight overlay |
| `components/ThemeToggle.tsx` | Header theme switch |
| `components/Toast.tsx` | Error toasts |
| `hooks/useTheme.ts` | Theme persistence |
| `components/AssistantPanel.tsx` | Fixed layout, closed default |
| `components/FieldList.tsx` | Confidence badges, active field state |
| `styles.css` | Full design token layer |

## How to verify in-browser

1. `python run_dev.py` from repo root
2. Open `http://127.0.0.1:5173/` — hard refresh (Ctrl+F5)
3. Toggle sun/moon in header → entire UI switches; reload preserves choice
4. **Load demo sample** → fields appear; open assistant → panel fully on-screen, not clipping right
5. Hover a field → preview highlight + cited passage strip
6. Zoom preview with +/- controls
7. Resize to ~390px → assistant becomes bottom sheet; no horizontal scroll on body
8. Compiled CSS should be ~20–35 KB (`npm run build` → check `dist/assets/index-*.css`)

## Backend unchanged (frontend transformation pass)

The frontend transformation pass did not modify API routes, AI pipeline, demo honesty path, or model defaults.

---

# Final polish & wow pass — change log

Capstone pass: demo-locked MVP with gallery-first flow, perfected citation highlight loop, review/auditability layer, insights strip, and production polish. **Section 6 stretch (multi-doc compare, brief export) was intentionally skipped.**

## Sample gallery integration

**Location:** `backend/samples/` (canonical — `data/samples/` and `backend/data/samples/` were not present; samples were created in-repo).

| ID | Quality note |
| --- | --- |
| `saudi-regulatory-circular` | **Lead demo** — `recommended_lead: true` in manifest |
| `commercial-agreement` | Strong; one moderate-confidence clause |
| `compliance-notice` | Strong bilingual sample |
| `arabic-tax-invoice` | Avoid leading — total amount confidence ~0.58 |
| `board-resolution` | Avoid leading — effective date confidence ~0.55 |

Each folder: `extraction.json` + `preview.png`. Manifest: `backend/samples/manifest.json`.

**Backend:**

- `app/services/samples.py` — list, load, thumbnail serve
- `app/api.py` — `GET /api/samples`, `GET /api/samples/{id}/thumbnail`, `POST /api/samples/{id}/load`; demo route loads regulatory circular
- `scripts/generate_samples.py` — regenerate preview PNGs from extractions

**Frontend:** `SampleGallery.tsx` on landing; upload secondary.

## Hero highlight loop (ask → answer → source)

- `app/services/citations.py` — maps RAG excerpts to field `source` snippets
- Chat responses include resolved `source_snippets`; frontend never fakes highlights
- `DocumentViewer.tsx` — snippet text match, scroll/zoom ~350ms, positioned overlay
- `AssistantPanel.tsx` — “Jump to source”, suggested question chips, honest no-citation copy
- Bidirectional: field hover/click ↔ citation click ↔ highlight click → field focus
- `useReducedMotion.ts` — disables large motion when user prefers reduced motion

## Review / auditability layer

- `ReviewBanner.tsx` — “X fields need review”, filter toggle, jump to first flagged field
- `FieldList.tsx` — review-only filter, amber accent, scroll targets by field id
- `PATCH /api/documents/{id}/extraction` — persists transcription/field edits to session storage on disk
- `lib/documentIntel.ts` — confidence thresholds, suggested questions, review counts

## Insights strip

- `InsightsStrip.tsx` — document kind, language, page count, party/date highlights, summary, overall confidence
- Rendered in `SplitView.tsx` above fields

## Polish & a11y

| Item | Implementation |
| --- | --- |
| Skeleton loaders | `Skeletons.tsx` during processing |
| Exports | Branded DOCX header + fields table; JSON full payload; CSV fields-only |
| Shortcuts | `?`, Alt+T/A/P — `ShortcutsModal.tsx`, `useKeyboardShortcuts.ts` |
| Focus / ARIA | Dialog roles, FAB label, `:focus-visible` rings |
| Micro-copy | Honest empty states, no fake AI chat without key |
| Responsive | Gallery grid; mobile assistant bottom sheet (unchanged from prior pass) |

## Config & model defaults

- `backend/.env.example` — default `OPENAI_MODEL=gpt-4o-mini`; comment to use `gpt-4o` for live demo
- `backend/app/config.py` — aligned default model

## Testing performed

```powershell
conda run -n IntelStack python -m pytest backend/tests -q   # 10 passed
cd frontend && npm run build                                   # OK — CSS ~28.87 KB
```

New/updated tests: gallery list/load, citation resolver, CSV export, demo document route.

No browser E2E automation; manual gauntlet documented in [10-demo-playbook.md](./10-demo-playbook.md).

## Before / after demo experience

| Before | After |
| --- | --- |
| “Load demo sample” single button | 5-card gallery with thumbnails — zero friction, offline |
| Field hover highlight only | Ask → stream → Jump to source → animated document highlight + field sync |
| Confidence badges per field only | Review banner, filter, one-click jump to flagged source |
| Generic processed header | Insights strip — instant “it understood the document” |
| Spinners during process | Skeleton loaders |
| DOCX + JSON only | + CSV; branded DOCX header |
| No keyboard affordances | `?` shortcuts modal |

## Remaining limitations / future recommendations

1. **Pixel-perfect highlights** — would need layout/OCR bounding boxes; current approach matches snippet text in transcription context.
2. **Live vs prepared quality** — gallery extractions are curated; live uploads may vary; lead with regulatory circular.
3. **Stretch features deferred** — multi-document compare, regulatory diff, one-page brief export (pick one in a future sprint if needed).
4. **CI / E2E** — add Playwright smoke test for gallery load + highlight focus when bandwidth allows.
5. **Integration tests** — optional `pytest -m integration` against live OpenAI for regression on extraction schema.
