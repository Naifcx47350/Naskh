# Frontend Guide

## Stack

- **React** + **TypeScript** + **Vite**
- **Tailwind CSS v3.4** with `darkMode: "class"` (do not upgrade to v4 without full CSS regression test)
- **Framer Motion** for transitions and micro-interactions
- **react-dropzone** for uploads
- **lucide-react** for icons

## File structure

```
frontend/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.tsx              # Theme init + React entry
│   ├── App.tsx               # Layout, gallery, citation focus, shortcuts
│   ├── styles.css            # Design tokens + naskh-* components
│   ├── types.ts
│   ├── lib/
│   │   ├── api.ts
│   │   └── documentIntel.ts  # Review helpers, suggested questions, snippet match
│   ├── hooks/
│   │   ├── useTheme.ts
│   │   ├── useReducedMotion.ts
│   │   └── useKeyboardShortcuts.ts
│   └── components/
│       ├── SampleGallery.tsx   # 5-card offline demo picker
│       ├── UploadZone.tsx
│       ├── SplitView.tsx       # Insights, review banner, skeletons, exports
│       ├── DocumentViewer.tsx  # Zoom, pages, positioned highlight (~350ms)
│       ├── FieldList.tsx       # Confidence badges, review filter, field IDs
│       ├── InsightsStrip.tsx   # Document intelligence summary card
│       ├── ReviewBanner.tsx    # “X fields need review” + jump
│       ├── ProcessingState.tsx
│       ├── Skeletons.tsx       # Viewer/field loading placeholders
│       ├── AssistantPanel.tsx  # Suggested chips, Jump to source, streaming
│       ├── ShortcutsModal.tsx
│       ├── ThemeToggle.tsx
│       └── Toast.tsx
└── package.json
```

## Theme system

CSS variables in `styles.css` define light (`:root`) and dark (`html.dark`) palettes:

`--bg`, `--bg-elevated`, `--surface`, `--border`, `--text`, `--text-muted`, `--primary`, `--accent`, `--success`, `--warn`, `--ring`, plus `--paper` for the document preview (always light).

- Default: `prefers-color-scheme`, overridden by `localStorage` key `naskh-theme`
- Toggle: sun/moon button in the header (`ThemeToggle.tsx`) or **Alt+T**
- All `naskh-*` classes use variables — components should not hard-code hex colors
- Review-state fields use amber accent (`.naskh-field-review`)

## Sample gallery

`SampleGallery.tsx` fetches `GET /api/samples` and renders cards with:

- Thumbnail (`/api/samples/{id}/thumbnail`)
- Name + one-line description from `manifest.json`
- “Recommended” badge on `saudi-regulatory-circular`

Clicking a card calls `POST /api/samples/{id}/load` — document + prepared extraction load instantly with no OpenAI call.

Upload remains available below the gallery for live-AI demos.

## API communication

```typescript
const API_BASE = import.meta.env.VITE_API_BASE ?? "";
```

In dev, `API_BASE` is empty — requests go to `/api/...` and Vite proxies to the backend.

Key routes used by the UI:

| Route | Purpose |
| --- | --- |
| `GET /api/samples` | Gallery metadata |
| `POST /api/samples/{id}/load` | Load prepared sample |
| `PATCH /api/documents/{id}/extraction` | Persist transcription/field edits |
| `GET /api/documents/{id}/export/csv` | Fields-only CSV download |
| `POST /api/documents/{id}/chat/stream` | SSE assistant |

## UI states

| State | User sees |
| --- | --- |
| Landing / hero | Sample gallery (primary), upload zone (secondary), theme toggle |
| Sample loaded | Full split view immediately — fields, insights, transcription, exports |
| Uploaded (no extraction) | Viewer + “Process document” |
| Processing | Skeleton loaders in viewer + fields; stepper in output panel |
| Processed | Split view with insights strip, review banner, fields, exports |
| Error | Toast notification (top center) |
| Assistant | FAB bottom-right; closed by default; suggested question chips when empty |

## Document viewer & citation loop

`DocumentViewer.tsx` renders `preview_urls` with:

- Zoom in/out (50%–250%)
- Multi-page navigation
- Info strip: document kind, language, page count
- **Positioned highlight** — `documentIntel.ts` locates citation snippet text; viewer scrolls/zooms (~350ms unless reduced motion)
- **Bidirectional sync:**
  - Hover/click field → highlight on document
  - Click citation / “Jump to source” in chat → highlight + emphasize field
  - Click highlight overlay → focus related field in list
- Honest empty state when answer has no `source_snippets`

`useReducedMotion()` disables large scroll/zoom animations when `prefers-reduced-motion: reduce`.

## Insights strip

`InsightsStrip.tsx` sits above the field list and shows:

- Document kind, language, page count
- Party/date highlights from top fields
- One-line AI summary from extraction
- Overall confidence indicator (derived from field scores)

## Review layer

`ReviewBanner.tsx` + `FieldList.tsx`:

- Top banner: “**N** fields need review” (confidence below threshold)
- **Show review only** filter toggle
- **Jump to first review** — scrolls field list + triggers viewer highlight via shared focus state in `App.tsx`
- Review fields styled with amber accent

Threshold and labels live in `lib/documentIntel.ts` (High / Moderate / Review recommended).

## Assistant panel

- Fixed anchor: bottom-right, `width: min(380px, calc(100vw - 2rem))`
- Closed by default; **Alt+A** toggles
- Enabled when extraction exists **and** `ai_ready` from `/api/health`
- **Suggested question chips** in empty state — tap to send
- Streaming chat via SSE `/chat/stream`
- Each cited answer: **Jump to source** button → `onFocusCitation` → viewer + field
- No citation: honest inline message (no fake highlight)

Desktop: main container adds right padding when panel is open (`naskh-container-assistant-open`).

Mobile: bottom sheet + backdrop tap-to-close.

## Keyboard shortcuts

Press **?** anywhere (except inputs) for the modal. Defaults:

| Shortcut | Action |
| --- | --- |
| `?` | Show shortcuts |
| `Alt+T` | Toggle theme |
| `Alt+A` | Toggle assistant |
| `Alt+P` | Process document |

Implemented in `hooks/useKeyboardShortcuts.ts` + `ShortcutsModal.tsx`.

## Split view behavior

**Left:** `DocumentViewer` with highlight sync from fields, review jumps, and assistant citations.

**Right:** Insights strip → review banner → structured fields → editable transcription → export links (DOCX, JSON, CSV).

## Accessibility

- Visible focus rings on interactive controls (`:focus-visible`)
- ARIA: shortcuts dialog (`role="dialog"`, labelled title), FAB label
- `prefers-reduced-motion` honored via `useReducedMotion`
- Semantic buttons for gallery cards and citation actions

## Styling conventions

Key classes in `styles.css`:

- `naskh-card`, `naskh-pill`, `naskh-btn-primary`, `naskh-btn-secondary`
- `naskh-gallery-*`, `naskh-insights-*`, `naskh-review-*`
- `naskh-field-card`, `naskh-field-review`, `naskh-transcription`
- `naskh-viewer-*`, `naskh-highlight-positioned`
- `naskh-skeleton-*`, `naskh-modal-*`
- `naskh-assistant-root`, `naskh-chat-panel`, `naskh-assistant-fab`

## Dev commands

```powershell
cd frontend
npm run dev      # http://127.0.0.1:5173
npm run build    # tsc + vite build → dist/
npm run preview  # Serve production build
```

Production CSS should be ~28–30 KB gzipped ~6 KB (confirms Tailwind compiled fully).

## Troubleshooting styling

If the UI looks unstyled:

1. Stop all Vite processes; run `python run_dev.py` from repo root
2. Hard refresh **Ctrl+F5**
3. Confirm compiled CSS is ~20–35 KB (not ~7 KB)
4. Confirm `tailwindcss` is v3.4.x in `package.json`

See also [11-implementation-changes.md](./11-implementation-changes.md) for changelogs.
