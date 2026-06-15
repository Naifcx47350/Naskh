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

## Prototype scope

- Upload PDF or image (PNG/JPEG/WebP)
- Rasterize PDFs into faithful page previews without requiring Poppler
- Load five prepared sample documents for an offline-safe demo path
- Extract structured fields via server-side OpenAI structured outputs
- Review confidence and jump from fields/citations to source highlights
- Ask cited questions through the floating assistant when an API key is configured
- Export DOCX, JSON, and CSV

## Out of scope

- User accounts, auth, payments
- Government system integrations
- Broad document-type support
- Full production OCR pipeline or fine-tuned Arabic models

## Review alignment

| Criterion | How Naskh addresses it |
| --- | --- |
| Problem relevance | Saudi rules-and-regulations digitization backlog |
| AI utilization | Vision extraction, structured outputs, Chroma RAG, cited chat |
| Technical implementation | FastAPI + React, Pydantic schemas, real pipeline (not mocked UI) |
| Creativity | Split-view sync highlight + embedded assistant bubble |
| Demo quality | Polished UI, sample gallery, loading states, cited source highlights |
| Future vision | Fine-tuned Arabic model, scale, human review at volume |

## Hero demo path

1. Open app → choose a document from the sample strip
2. Show structured fields, confidence, transcription, and insights
3. Hover/click a field → source highlight on original preview
4. If an API key is configured, ask the assistant a question → cited answer + highlight
5. Export DOCX, JSON, or CSV
6. Close with honest limitations + future vision
