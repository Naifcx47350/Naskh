import type { DocumentExtraction, ExtractedField } from "../types";

const REVIEW_THRESHOLD = 0.65;

export function needsReview(confidence: number) {
  return confidence < REVIEW_THRESHOLD;
}

export function reviewCount(fields: ExtractedField[]) {
  return fields.filter((field) => needsReview(field.confidence)).length;
}

export function averageConfidence(fields: ExtractedField[]) {
  if (!fields.length) return null;
  return fields.reduce((sum, field) => sum + field.confidence, 0) / fields.length;
}

export function normalizeText(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function tokenOverlap(left: string, right: string) {
  const a = new Set(normalizeText(left).split(" "));
  const b = new Set(normalizeText(right).split(" "));
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.max(a.size, b.size);
}

export function matchFieldBySnippet(fields: ExtractedField[], snippet: string): number | null {
  if (!snippet.trim()) return null;
  let bestIndex: number | null = null;
  let bestScore = 0;
  fields.forEach((field, index) => {
    const score = Math.max(
      tokenOverlap(snippet, field.source.snippet),
      tokenOverlap(snippet, field.value),
      normalizeText(field.source.snippet).includes(normalizeText(snippet)) ? 1 : 0,
    );
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestScore >= 0.25 ? bestIndex : null;
}

export function snippetVerticalRatio(transcription: string, snippet: string): number | null {
  const lines = transcription.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length || !snippet.trim()) return null;
  const target = normalizeText(snippet);
  for (let i = 0; i < lines.length; i += 1) {
    const line = normalizeText(lines[i]);
    if (line.includes(target) || target.includes(line) || tokenOverlap(line, snippet) >= 0.45) {
      return (i + 0.5) / lines.length;
    }
  }
  return null;
}

export function buildSuggestedQuestions(extraction: DocumentExtraction): string[] {
  const questions: string[] = [];
  const title = extraction.fields.find((field) => field.field_type === "title");
  const date = extraction.fields.find((field) => field.field_type === "date");
  const party = extraction.fields.find((field) => field.field_type === "party");
  const clause = extraction.fields.find((field) => field.field_type === "clause");

  if (title) questions.push("What is the document title?");
  if (party) questions.push(`Who is ${party.label.toLowerCase()}?`);
  if (date) questions.push("What is the deadline or effective date?");
  if (clause) questions.push("What action is required?");
  if (questions.length < 3) questions.push("Summarize this document in one sentence.");

  return [...new Set(questions)].slice(0, 3);
}
