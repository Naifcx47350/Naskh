from openai import OpenAI

from app.config import Settings
from app.schemas import ChatAnswer, DocumentExtraction


EXTRACTION_PROMPT = """You are Naskh, a human-in-the-loop document intelligence assistant.

Extract structured fields from printed business documents and transcribe handwritten Arabic regulatory documents into clean editable text.
Do not overclaim certainty. Preserve Arabic paragraph structure and right-to-left text. Use exact source snippets whenever possible.
If a region is unclear, include it in notes and lower the confidence rather than inventing content.
"""


CHAT_PROMPT = """Answer questions only from the provided document excerpts.

Return a concise answer and cite exact source snippets that support it. If the excerpts do not contain the answer, say that the document does not provide enough evidence.
"""


class AiService:
    def __init__(self, settings: Settings) -> None:
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is required for AI processing.")
        self.settings = settings
        self.client = OpenAI(api_key=settings.openai_api_key)

    def extract_document(self, image_urls: list[str]) -> DocumentExtraction:
        content: list[dict] = [{"type": "input_text", "text": EXTRACTION_PROMPT}]
        content.extend({"type": "input_image", "image_url": image_url} for image_url in image_urls)

        response = self.client.responses.parse(
            model=self.settings.openai_model,
            input=[{"role": "user", "content": content}],
            text_format=DocumentExtraction,
        )

        parsed = getattr(response, "output_parsed", None)
        if parsed is None:
            refusal = _extract_refusal(response)
            if refusal:
                raise RuntimeError(refusal)
            raise RuntimeError("The model did not return a structured extraction.")

        return parsed

    def answer_question(self, question: str, excerpts: list[str]) -> ChatAnswer:
        context = "\n\n---\n\n".join(excerpts)
        response = self.client.responses.parse(
            model=self.settings.openai_model,
            input=[
                {"role": "system", "content": CHAT_PROMPT},
                {
                    "role": "user",
                    "content": f"Question: {question}\n\nDocument excerpts:\n{context}",
                },
            ],
            text_format=ChatAnswer,
        )

        parsed = getattr(response, "output_parsed", None)
        if parsed is None:
            refusal = _extract_refusal(response)
            if refusal:
                raise RuntimeError(refusal)
            raise RuntimeError("The model did not return a structured answer.")

        return parsed


def _extract_refusal(response: object) -> str | None:
    for output in getattr(response, "output", []) or []:
        for content in getattr(output, "content", []) or []:
            refusal = getattr(content, "refusal", None)
            if refusal:
                return str(refusal)
    return None
