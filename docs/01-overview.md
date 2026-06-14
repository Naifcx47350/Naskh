# Project Overview

## Name

- **Product name:** Naskh
- **Repo / environment name:** IntelliStack
- **Conda environment:** `IntelStack` (Python 3.11)

## Problem

Large volumes of Saudi regulatory and business documents still exist on paper or as unstructured scans. Teams need a human-in-the-loop assistant that can:

1. Digitize printed or handwritten Arabic documents into editable text
2. Extract structured fields (title, dates, parties, clauses)
3. Let an operator ask cited questions about the loaded document

## Positioning (important for pitch and UI copy)

Naskh is **not** claiming perfect Arabic handwriting OCR. It is a **first-pass AI assistant** where an operator reviews, edits, and approves output before archiving. This is honest, demo-safe, and aligned with the hackathon brief.

## MVP scope (in scope)

- Upload PDF or image (PNG/JPEG/WebP)
- Server-side vision extraction via OpenAI structured outputs
- Split-view UI: original preview + digitized output
- Hover field → highlight cited source snippet
- Floating document assistant with cited answers (RAG)
- Export to `.docx` and JSON
- Demo sample path when API key is missing or for stage reliability

## Out of scope (do not build before demo)

- User accounts, auth, payments
- Government system integrations
- Broad document-type support
- Full production OCR pipeline or fine-tuned Arabic models

## Judging alignment

| Criterion | How Naskh addresses it |
| --- | --- |
| Problem relevance | Saudi rules-and-regulations digitization backlog |
| AI utilization | Vision extraction, structured outputs, Chroma RAG, cited chat |
| Technical implementation | FastAPI + React, Pydantic schemas, real pipeline (not mocked UI) |
| Creativity | Split-view sync highlight + embedded assistant bubble |
| Demo quality | Polished UI, loading states, demo sample button |
| Future vision | Fine-tuned Arabic model, scale, human review at volume |

## Hero demo path (10-minute pitch)

1. Open app → click **Load demo sample**
2. Click **Process document** → show structured fields + Arabic transcription
3. Hover a field → source highlight on original panel
4. Ask assistant: *What is the document title?* → cited answer + highlight
5. Export DOCX or JSON
6. Close with honest limitations + future vision
