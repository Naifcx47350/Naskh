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

1. Hero section explains the human-in-the-loop framing and the AI features.
2. Drag-and-drop upload panel sends PDF/image files to the backend.
3. Split view shows the original preview on the left and digitized output on the right.
4. Hovering extracted fields sends the source snippet back to the preview panel for a visible citation highlight.
5. The floating assistant opens from the bottom-right and answers from the current processed document.
6. Export buttons download `.docx` and JSON from backend endpoints.

## Visual System

- Palette: warm sand background, deep ink surfaces, copper accent.
- Cards use soft shadows, rounded corners, and translucent glass surfaces.
- Arabic output renders with an Arabic-friendly font stack and switches to `dir="rtl"` when Arabic text is detected.
- Processing state is animated so the UI never looks frozen during AI calls.

## Demo Priorities

Keep the first document path flawless before adding extra document types. The most important visible moments are upload reveal, extraction processing animation, field-to-source highlight, and the assistant returning cited answers.
