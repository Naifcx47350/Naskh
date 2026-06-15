from app.schemas import DocumentExtraction, SourceRegion


def _normalize(text: str) -> str:
    return " ".join(text.lower().split())


def _overlap_score(left: str, right: str) -> float:
    a = _normalize(left)
    b = _normalize(right)
    if not a or not b:
        return 0.0
    if a in b or b in a:
        return 1.0
    a_tokens = set(a.split())
    b_tokens = set(b.split())
    if not a_tokens or not b_tokens:
        return 0.0
    return len(a_tokens & b_tokens) / max(len(a_tokens), len(b_tokens))


def resolve_citation_sources(extraction: DocumentExtraction, excerpts: list[str]) -> list[SourceRegion]:
    """Map RAG excerpts to the best matching structured field sources."""
    resolved: list[SourceRegion] = []
    seen: set[str] = set()

    for excerpt in excerpts:
        excerpt = excerpt.strip()
        if not excerpt:
            continue

        best_field = max(
            extraction.fields,
            key=lambda field: _overlap_score(excerpt, field.source.snippet),
            default=None,
        )
        if best_field and _overlap_score(excerpt, best_field.source.snippet) >= 0.25:
            source = best_field.source
        elif _overlap_score(excerpt, extraction.transcription) >= 0.2:
            source = SourceRegion(page=1, snippet=excerpt[:240])
        else:
            continue

        key = f"{source.page}:{source.snippet}"
        if key in seen:
            continue
        seen.add(key)
        resolved.append(source)

    return resolved
