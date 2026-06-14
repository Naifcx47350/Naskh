# Demo Playbook

Step-by-step guide for presenting Naskh in a hackathon or stakeholder demo (~10 minutes).

## Before the session

### Environment checklist

- [ ] Conda env `IntelStack` activated
- [ ] `backend/.env` configured (prefer real key for live demo)
- [ ] `python run_dev.py` starts both servers cleanly
- [ ] Browser opens to `http://127.0.0.1:5173/`
- [ ] Hard refresh once (Ctrl+F5) to avoid stale CSS
- [ ] Optional: close unrelated tabs; disable notifications

### Backup plan

If API fails or network blocks OpenAI:

1. Use **Load demo sample** (no upload)
2. **Process document** — sample extraction loads
3. Assistant still answers from demo logic
4. Exports still work

Practice this path once so you can switch without panic.

### Sample files to prepare (live path)

| File | Why |
| --- | --- |
| Clear PNG of printed Arabic circular | Shows transcription + fields |
| Photo of handwritten note (optional) | Shows honest “first pass” positioning |
| PDF (if Poppler installed) | Shows multi-format support |

Keep files on desktop for drag-drop; do not rely on slow network upload during pitch.

---

## Demo script (recommended order)

### 1. Hook (30 sec)

> “Saudi organizations still have mountains of paper rules and contracts. Naskh is a human-in-the-loop assistant: AI does the first pass, your team reviews and approves.”

Show landing page — point out upload zone and assistant bubble.

### 2. Ingest (1 min)

**Option A — Live upload:** Drag prepared PNG/PDF onto upload zone.

**Option B — Safe default:** Click **Load demo sample**.

Confirm preview appears in the workspace.

### 3. Extract (2 min)

Click **Process document**.

While loading:

> “We send page previews to a vision model server-side — keys never hit the browser. Output is structured: fields, confidence, and full Arabic transcription.”

When complete:

- Scroll structured fields
- **Hover a field** → source highlight on original panel
> “Every field is tied to an exact source snippet for auditability.”

### 4. Human review (1 min)

Click into transcription textarea; make a small edit.

> “The operator corrects Arabic text before export — we’re not claiming perfect OCR.”

### 5. Assistant (2 min)

Open floating assistant (already visible). Ask:

- “What is the document title?”
- “Who issued this document?”
- “Summarize the main obligation.”

When answer arrives, point to **cited snippets** and highlight on preview.

> “Answers are grounded in the document via RAG — not generic ChatGPT.”

### 6. Export (1 min)

Download **DOCX** and briefly open it, or **JSON** for integrators.

> “Ready for archive or downstream systems.”

### 7. Close — vision + honesty (1 min)

**Vision:** Batch digitization, review queues, fine-tuned Arabic models, government-scale backlog.

**Honesty:** Handwriting is assistive; Poppler improves PDF fidelity; no auth in MVP.

---

## Talking points for judges

| Question | Answer |
| --- | --- |
| Why not pure OCR? | Arabic handwriting + regulatory layout needs human review; we optimize for cited, editable first pass |
| Where is AI? | Vision extraction, structured outputs, embeddings, RAG chat |
| Security? | API keys backend-only; no client-side model calls |
| Differentiator? | Split-view source sync + embedded cited assistant in one flow |
| Scalability story? | Chunk indexing per doc → queue workers → fine-tuned models (roadmap) |

---

## Troubleshooting during live demo

| Symptom | Fix |
| --- | --- |
| Blank/unstyled UI | Stop servers; `python run_dev.py`; Ctrl+F5 |
| 404 on port 8000 | You opened backend URL — use **5173** for UI |
| Process error | Switch to demo sample + process |
| Slow process | Narrate “vision model analyzing pages”; have demo sample pre-processed in second tab as backup |
| PDF looks like text not scan | Mention Poppler optional; use PNG for demo |
| Chat empty | Ensure process completed first |

---

## Post-demo Q&A prep

- **Cost:** `gpt-4o-mini` default; ~few cents per document for MVP page counts
- **Languages:** Optimized for Arabic; handles mixed Arabic/English
- **Data retention:** Local `backend/data/` only in MVP
- **Next sprint:** Streaming chat, RTL polish, transcription save — see [09-roadmap.md](./09-roadmap.md)
