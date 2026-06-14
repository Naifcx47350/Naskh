# Roadmap and Enhancement Plan

This document captures **what to do next** after the hackathon MVP, prioritized for demo impact vs engineering effort.

## Priority matrix

| Priority | Item | Impact | Effort |
| --- | --- | --- | --- |
| P0 | Stable live demo with real API key + prepared sample docs | Judging | Low |
| P0 | Pitch script + backup demo path (no key) | Judging | Low |
| P1 | Streaming chat responses | UX polish | Medium |
| P1 | Arabic RTL rendering (UI + DOCX) | Credibility for Arabic docs | Medium |
| P1 | Split frontend into components | Team velocity | Medium |
| P2 | `gpt-4o` toggle for quality-critical demos | Quality | Low |
| P2 | CI: pytest on push | Team hygiene | Low |
| P2 | Poppler install doc for Windows | PDF fidelity | Low |
| P3 | Persist edited transcription to backend | Product completeness | Medium |
| P3 | Multi-page PDF navigation in UI | Real-world docs | Medium |
| P3 | Batch upload / queue | Scale story | High |
| P4 | Auth + tenant isolation | Production | High |
| P4 | Fine-tuned Arabic handwriting model | Long-term vision | High |

---

## Phase 1 — Demo hardening (before pitch)

**Goal:** Zero-surprise 10-minute demo.

- [ ] Prepare 2–3 real Saudi regulatory / business sample images (PNG) that extract well with `gpt-4o-mini`
- [ ] Test full flow with API key on presentation machine
- [ ] Keep **Load demo sample** as offline backup
- [ ] Document exact click path in [10-demo-playbook.md](./10-demo-playbook.md)
- [ ] Optional: set `OPENAI_MODEL=gpt-4o` in `.env` for final rehearsal only

---

## Phase 2 — UX and Arabic quality

**Goal:** Feel production-minded without scope creep.

### Streaming chat

- Use OpenAI streaming in `ai.py`
- Update frontend assistant to append tokens incrementally
- Keep citation parsing at end of stream or use structured partial JSON

### RTL support

- UI: `dir="rtl"` on transcription and Arabic field values; Arabic-friendly font (e.g. Noto Naskh Arabic)
- Export: wire `arabic-reshaper` + `python-bidi` in `exports.py` for DOCX paragraphs
- Test with mixed Arabic/English documents

### Transcription persistence

- `PATCH /api/documents/{id}/extraction` to save operator edits
- Re-index Chroma after save

---

## Phase 3 — Engineering hygiene

**Goal:** Easier multi-developer work.

- [ ] GitHub Actions: `pytest backend/tests`, `npm run build`
- [ ] Extract React components: `UploadZone`, `SplitView`, `AssistantPanel`, `FieldList`
- [ ] Shared OpenAPI-generated types or hand-maintained `frontend/src/types.ts`
- [ ] `.env.example` comments for all settings
- [ ] Docker Compose optional profile (backend + frontend + volume for data)

---

## Phase 4 — Product extensions (post-hackathon narrative)

Use these for **future vision** slide, not MVP build:

| Theme | Direction |
| --- | --- |
| Scale | Queue workers for batch digitization, S3 storage, Postgres metadata |
| Quality | Human review dashboard, confidence thresholds, active learning |
| Arabic | Domain fine-tune, specialized OCR ensemble, dialect handling |
| Integrations | Export to ECM, government portals, e-signature workflows |
| Compliance | Audit log, role-based access, data residency |

---

## Technical debt register

| Debt | Risk | Mitigation |
| --- | --- | --- |
| Monolithic `App.tsx` | Merge conflicts | Component split in Phase 3 |
| File-based storage | No concurrent multi-user | Accept for MVP; design DB schema early |
| No streaming | Slow-feeling chat | Phase 2 |
| Tailwind v3 pin | Upgrade friction | Document version lock in tech stack doc |
| Windows-specific port kill in `run_dev.py` | Linux/macOS edge cases | Add platform branches or use `kill-port` npm package |

---

## Suggested team roles (if splitting work)

| Owner | Focus |
| --- | --- |
| Backend / AI | Prompt tuning, RAG quality, streaming, exports |
| Frontend | RTL, component refactor, assistant UX |
| Demo / PM | Sample docs, script, pitch deck alignment |
| DevOps | CI, env docs, optional Docker |

---

## Definition of done for “post-MVP v0.2”

1. Live extraction on 3 prepared samples with >90% field accuracy (human judged)
2. Chat answers cite correct snippets in 4/5 test questions
3. Edited transcription persists across refresh
4. CI green on main branch
5. `docs/` updated with any API or env changes
