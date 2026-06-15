# Demo Playbook

Step-by-step guide for presenting Naskh in a hackathon or stakeholder demo (~10 minutes). **Primary path: sample gallery (offline-safe).** Live upload is the optional “real files too” beat.

## Before the session

### Environment checklist

- [ ] Conda env `IntelStack` activated
- [ ] `backend/.env` configured — **`OPENAI_MODEL=gpt-4o-mini`** for rehearsals; switch to **`gpt-4o`** only for final live demo if quality matters more than cost
- [ ] `python run_dev.py` from repo root — both servers start cleanly
- [ ] Browser: `http://127.0.0.1:5173/` (not port 8000)
- [ ] Hard refresh once (**Ctrl+F5**) to avoid stale CSS
- [ ] Optional: close unrelated tabs; disable notifications

### Fallback plan (network / API failure)

**You can run the entire core demo without OpenAI:**

1. Gallery → pick **Regulatory Circular** (or any of the 5 samples)
2. Fields, insights, transcription, review banner, exports — all work instantly
3. Hover fields → source highlight on viewer
4. Review jump → flagged field + document region
5. Assistant shows suggested questions but chat is disabled with an honest API-key message

If API drops **mid-demo** after you started live chat:

> “The offline gallery path shows the same extraction and audit workflow — let me continue from the prepared sample.”

Click **Regulatory Circular** in the gallery and resume from fields + highlight + export. Do not pretend chat still works.

Practice the gallery-only path once so you can switch without panic.

### Samples to use (and avoid)

| Sample | When to use |
| --- | --- |
| **Regulatory Circular** | **Open here** — best story, best highlight loop |
| Commercial Agreement | English contract variety |
| Compliance Notice | Bilingual policy |
| Arabic Tax Invoice | Only if discussing review — total field is low confidence |
| Board Resolution | Avoid as opener — date field needs review |

---

## Demo script (recommended order)

### 1. Hook (30 sec)

> “Saudi organizations still have mountains of paper rules and contracts. Naskh is a human-in-the-loop assistant: AI does the first pass, your team reviews exactly what needs attention.”

Show landing page — **sample gallery** front and center. Mention upload as secondary.

### 2. One-click ingest (30 sec) — gallery wow #1

Click **Regulatory Circular** card.

> “No upload spinner — we ship prepared business samples so the workflow is instant. In production, the same pipeline runs on live uploads.”

Confirm: preview, insights strip, fields, transcription appear **immediately**.

### 3. Auditability (1.5 min) — review story

Point at **insights strip** (document kind, language, summary, confidence).

Point at **“X fields need review”** banner (if shown):

> “We don’t hide uncertainty — amber fields are what a human should verify before export.”

- Hover a high-confidence field → highlight on document
- Click **Jump to review** (or a flagged field) → viewer scrolls to source

> “Every field ties to an exact source snippet. One click from flag to proof.”

### 4. Hero moment (2 min) — ask → answer → highlight

Open assistant (**Alt+A** or FAB). Tap a **suggested question chip**, e.g.:

- “What action is required?”
- “Who issued this document?”

While answer streams:

> “Answers are grounded in this document via RAG — not generic ChatGPT.”

When complete, click **Jump to source** on the citation:

> “The exact region lights up on the original — that’s the audit trail judges remember.”

*(Requires `OPENAI_API_KEY`. If missing, skip to step 5 and narrate chat from the pitch deck.)*

### 5. Human review (1 min)

Edit a line in the transcription textarea.

> “The operator corrects Arabic text before export — we’re honest that handwriting is a first pass, not solved OCR.”

### 6. Export (1 min)

Download **DOCX** (open briefly — titled header, fields table, RTL Arabic), **JSON**, or **CSV**.

> “Ready for archive, compliance queue, or downstream systems.”

### 7. Optional live upload (1 min)

If time and API allow: drag a PNG onto upload → **Process document**.

> “Same pipeline on documents you bring — keys stay server-side.”

### 8. Close — vision + honesty (1 min)

**Vision:** Batch digitization, review queues, fine-tuned Arabic models, government-scale backlog.

**Honesty:** Handwriting is assistive; highlights approximate snippet location; no auth in MVP; gallery uses curated extractions for reliable demos.

---

## Talking points for judges

| Question | Answer |
| --- | --- |
| Why not pure OCR? | Arabic handwriting + regulatory layout needs human review; we optimize for cited, editable first pass |
| Where is AI? | Vision extraction, structured outputs, embeddings, RAG chat |
| Security? | API keys backend-only; no client-side model calls |
| Differentiator? | Ask → cited answer → live source highlight + review layer in one flow |
| Offline / reliable demo? | Five-sample gallery with prepared extractions — no network required for core UX |
| Scalability story? | Chunk indexing per doc → queue workers → fine-tuned models (roadmap) |

---

## Troubleshooting during live demo

| Symptom | Fix |
| --- | --- |
| Blank/unstyled UI | Stop servers; `python run_dev.py`; Ctrl+F5 |
| 404 on port 8000 | You opened backend URL — use **5173** for UI |
| Gallery empty / 500 | Confirm `backend/samples/` exists with 5 folders + manifest |
| Process error on upload | Switch to gallery sample; narrate offline path |
| Slow process | Narrate “vision model analyzing pages”; fall back to gallery |
| PDF looks like text not scan | Mention Poppler optional; gallery uses PNG previews |
| Chat empty / disabled | Need API key + processed/indexed doc; use gallery + suggested chips |
| Highlight seems off | Snippet text match, not pixel OCR — honest positioning |
| Wrong model quality | Set `OPENAI_MODEL=gpt-4o` in `.env`, restart backend |

---

## Post-demo Q&A prep

- **Cost:** Default `gpt-4o-mini`; a few cents per document at MVP page counts; `gpt-4o` for higher extraction quality when needed
- **Languages:** Optimized for Arabic; handles mixed Arabic/English samples
- **Data retention:** Local `backend/data/` for uploads; gallery data in `backend/samples/` (committed)
- **Not in MVP:** Multi-doc compare, auth, CI — see [09-roadmap.md](./09-roadmap.md)

---

## 10-minute cold-start gauntlet (pre-lock checklist)

Run once before demo-lock:

1. `python run_dev.py` → Ctrl+F5
2. Click each of 5 gallery cards — all load fully offline
3. Regulatory Circular: hover field, review jump, export DOCX opens correctly
4. With API key: suggested chip → stream → Jump to source (smooth, no dead frame)
5. `?` shortcuts modal; Alt+T theme persists after reload
6. Resize to ~390px — gallery stacks, assistant is bottom sheet, no body overflow
