# Frontend Design Notes

> **Full documentation:** See [docs/07-frontend-guide.md](../docs/07-frontend-guide.md) and [docs/10-demo-playbook.md](../docs/10-demo-playbook.md).

The frontend is a presentation-first React app for the Naskh hackathon demo. It is intentionally a single focused hero path rather than a broad document management product.

## Stack

- Vite + React + TypeScript.
- Tailwind CSS for layout and visual system.
- `framer-motion` for entrance, hover, processing, and assistant animations.
- `react-dropzone` for a polished drag-and-drop upload interaction.
- `lucide-react` for consistent iconography.

## Screen Flow

1. Hero section explains the human-in-the-loop framing and AI features.
2. Upload panel includes a compact prepared-sample strip.
3. Split view shows the original preview on the left and digitized output on the right.
4. Hovering extracted fields highlights the precise source region when available.
5. The floating assistant opens from the bottom-right (`Ctrl+K`) and answers from the current document when live AI is configured.
6. Export buttons download DOCX, JSON, and CSV from backend endpoints.

## Visual System

- Palette: warm sand background, deep ink surfaces, copper accent.
- Cards use soft shadows, rounded corners, and translucent glass surfaces.
- Arabic output renders with an Arabic-friendly font stack and switches to `dir="rtl"` when Arabic text is detected.
- Processing state is animated so the UI never looks frozen during AI calls.
- Document preview supports Alt+wheel zoom and viewer-contained wheel scrolling.

## Demo Priorities

Keep the first document path flawless before adding extra features. The most important visible moments are sample load, field-to-source highlight, review confidence, and assistant cited answers.
