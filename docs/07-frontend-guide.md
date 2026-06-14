# Frontend Guide

## Stack

- **React** + **TypeScript** + **Vite**
- **Tailwind CSS v3.4** (do not upgrade to v4 without full CSS regression test)
- **Framer Motion** for transitions
- **react-dropzone** for uploads
- **lucide-react** for icons

## File structure

```
frontend/
├── index.html
├── vite.config.ts       # React plugin + /api proxy → :8000
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.tsx         # React entry
│   ├── App.tsx          # Entire application UI (~430 lines)
│   ├── styles.css       # @tailwind directives + naskh-* components
│   └── vite-env.d.ts
└── package.json
```

## API communication

```typescript
const API_BASE = import.meta.env.VITE_API_BASE ?? "";
```

In dev, `API_BASE` is empty — requests go to `/api/...` and Vite proxies to the backend.

The shared `api<T>()` helper in `App.tsx` wraps `fetch`, parses JSON errors, and throws on non-OK responses.

## UI states

| State | User sees |
| --- | --- |
| Landing / hero | Upload zone, demo button, feature cards |
| Uploaded | Preview thumbnails, **Process document** CTA |
| Processing | Animated loader overlay |
| Processed | Split view: original + extraction |
| Assistant | Floating bubble (open by default after process) |

## Split view behavior

**Left panel:** Preview image(s) from `preview_urls`. When a field is hovered or assistant cites a snippet, a highlight overlay appears using `source.page` and matching text context.

**Right panel:**

- Document summary and metadata
- Structured fields list (hover → highlight)
- Editable transcription textarea (client-side only; not persisted to server on edit)

## Styling conventions

Custom component classes live in `styles.css`:

- `naskh-card` — elevated panel with border and shadow
- `naskh-btn-primary` / `naskh-btn-secondary` — CTA buttons
- `naskh-input` — form controls
- Gradient hero background and glass-style panels

Tailwind utilities handle layout (`grid`, `flex`, spacing). Prefer extending `styles.css` for repeated component patterns rather than long inline class strings.

## Important UX decisions

1. **Assistant always mounted** — Visible from first load; encourages exploration even before upload.
2. **Demo sample button** — One-click path for judges without prepared files.
3. **Processing animation** — Communicates latency during OpenAI call.
4. **Export buttons** — Trigger browser download via API URLs (`/export/docx`, `/export/json`).

## Dev commands

```powershell
cd frontend
npm run dev      # http://127.0.0.1:5173
npm run build    # tsc + vite build → dist/
npm run preview  # Serve production build
```

## Troubleshooting styling

If the UI looks like unstyled HTML:

1. Stop all Vite processes
2. Run `python run_dev.py` from repo root (kills port 5173)
3. Hard refresh **Ctrl+F5**
4. Confirm `tailwindcss` in `package.json` is `^3.4.x`, not v4

Build output CSS should be ~20–35 KB. A ~7 KB CSS file usually means Tailwind did not compile utilities.

## Refactor opportunities (post-MVP)

| Item | Benefit |
| --- | --- |
| Split `App.tsx` into components | Easier parallel work |
| Shared types package or `types.ts` | Match backend schemas |
| React Query / SWR | Cache document state, retry |
| RTL wrapper for Arabic fields | Proper `dir="rtl"` + font stack |
| Streaming chat UI | Better perceived latency |
