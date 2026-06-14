export type SourceRegion = { page: number; snippet: string };

export type ExtractedField = {
  label: string;
  value: string;
  field_type: string;
  source: SourceRegion;
  confidence: number;
};

export type DocumentExtraction = {
  document_kind: string;
  language: string;
  summary: string;
  transcription: string;
  fields: ExtractedField[];
  notes: string[];
};

export type UploadResponse = {
  document_id: string;
  filename: string;
  content_type: string;
  preview_urls: string[];
};

export type ChatMessage = { role: "user" | "assistant"; content: string; sources?: SourceRegion[] };
