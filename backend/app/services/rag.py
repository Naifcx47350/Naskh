import re

import chromadb
from chromadb.utils import embedding_functions

from app.config import Settings
from app.schemas import DocumentExtraction


def _collection_name(document_id: str) -> str:
    return f"doc_{document_id}"


def _chunk_text(text: str, size: int = 900, overlap: int = 150) -> list[str]:
    cleaned = re.sub(r"\n{3,}", "\n\n", text.strip())
    if not cleaned:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(cleaned):
        end = min(start + size, len(cleaned))
        chunks.append(cleaned[start:end].strip())
        if end == len(cleaned):
            break
        start = max(0, end - overlap)
    return [chunk for chunk in chunks if chunk]


class RagService:
    def __init__(self, settings: Settings) -> None:
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is required for document search.")
        self.settings = settings
        self.client = chromadb.PersistentClient(path=str(settings.data_dir / "chroma"))
        self.embedding = embedding_functions.OpenAIEmbeddingFunction(
            api_key=settings.openai_api_key,
            model_name=settings.openai_embedding_model,
        )

    def index_extraction(self, document_id: str, extraction: DocumentExtraction) -> None:
        name = _collection_name(document_id)
        try:
            self.client.delete_collection(name)
        except Exception:
            pass

        collection = self.client.get_or_create_collection(
            name=name,
            embedding_function=self.embedding,
            metadata={"document_id": document_id},
        )
        source_text = "\n\n".join(
            [
                extraction.summary,
                extraction.transcription,
                "\n".join(f"{field.label}: {field.value}" for field in extraction.fields),
            ]
        )
        chunks = _chunk_text(source_text)
        if not chunks:
            return

        collection.add(
            ids=[f"{document_id}-{index}" for index in range(len(chunks))],
            documents=chunks,
            metadatas=[{"document_id": document_id, "chunk": index} for index in range(len(chunks))],
        )

    def retrieve(self, document_id: str, question: str, top_k: int = 4) -> list[str]:
        collection = self.client.get_collection(
            name=_collection_name(document_id),
            embedding_function=self.embedding,
        )
        result = collection.query(query_texts=[question], n_results=top_k)
        documents = result.get("documents") or [[]]
        return [text for text in documents[0] if text]
