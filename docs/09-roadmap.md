# Roadmap

Suggested next steps if Naskh moves beyond prototype review.

## Near-Term Engineering

- Add GitHub Actions for `pytest backend/tests` and `npm run build`.
- Add a small browser smoke test for sample load, highlight sync, assistant toggle, and export links.
- Expand the sample set with more verified PDFs and saved highlight regions.
- Persist human review status separately from extracted field confidence.

## Product Extensions

- Multi-document comparison for contracts or circular revisions.
- Batch upload and review queue.
- Role-based auth and tenant isolation.
- External object storage and database-backed metadata.
- Better Arabic handwriting quality through specialized OCR or fine-tuned models.

## Not Planned For This Prototype

- Payments or marketplace features.
- Full government system integration.
- Production compliance workflow.
- Unbounded support for every document type.
