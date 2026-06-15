import { AlertTriangle, Calendar, Languages, Layers, Sparkles } from "lucide-react";

import { averageConfidence } from "../lib/documentIntel";
import type { DocumentExtraction } from "../types";

export function InsightsStrip({
  extraction,
  pageCount,
}: {
  extraction: DocumentExtraction;
  pageCount: number;
}) {
  const avg = averageConfidence(extraction.fields);
  const title = extraction.fields.find((field) => field.field_type === "title");
  const date = extraction.fields.find((field) => field.field_type === "date");
  const party = extraction.fields.find((field) => field.field_type === "party");

  return (
    <div className="naskh-insights">
      <div className="flex items-center gap-2">
        <Sparkles size={16} style={{ color: "var(--accent)" }} />
        <p className="font-semibold">Document intelligence</p>
      </div>
      <p className="mt-2 text-sm" dir="auto" style={{ color: "var(--text-muted)" }}>
        {extraction.summary}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="naskh-info-chip"><Layers size={12} /> {extraction.document_kind}</span>
        <span className="naskh-info-chip"><Languages size={12} /> {extraction.language}</span>
        {pageCount > 0 && <span className="naskh-info-chip"><Calendar size={12} /> {pageCount} page{pageCount === 1 ? "" : "s"}</span>}
        {title && <span className="naskh-info-chip" dir="auto">Title: {title.value}</span>}
        {date && <span className="naskh-info-chip" dir="auto">Date: {date.value}</span>}
        {party && <span className="naskh-info-chip" dir="auto">{party.label}: {party.value}</span>}
        {avg != null && (
          <span className={`naskh-info-chip ${avg < 0.7 ? "naskh-info-chip-warn" : ""}`}>
            {avg < 0.7 && <AlertTriangle size={12} />}
            Overall confidence {Math.round(avg * 100)}%
          </span>
        )}
      </div>
    </div>
  );
}
