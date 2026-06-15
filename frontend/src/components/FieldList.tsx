import { motion } from "framer-motion";
import { forwardRef, type Ref } from "react";

import { useReducedMotion } from "../hooks/useReducedMotion";
import { needsReview } from "../lib/documentIntel";
import type { ExtractedField } from "../types";

function confidenceMeta(confidence: number) {
  if (needsReview(confidence)) return { label: "Review recommended", warn: true };
  if (confidence < 0.85) return { label: "Moderate", warn: false };
  return { label: "High confidence", warn: false };
}

export const FieldList = forwardRef(function FieldList(
  {
    fields,
    activeFieldIndex,
    showReviewOnly,
    onActiveSnippet,
    onFieldSelect,
  }: {
    fields: ExtractedField[];
    activeFieldIndex: number | null;
    showReviewOnly: boolean;
    onActiveSnippet: (snippet: string | null) => void;
    onFieldSelect: (index: number | null) => void;
  },
  ref: Ref<HTMLDivElement>,
) {
  const reducedMotion = useReducedMotion();
  const visible = fields
    .map((field, index) => ({ field, index }))
    .filter(({ field }) => !showReviewOnly || needsReview(field.confidence));

  return (
    <div ref={ref} className="grid gap-3 sm:grid-cols-2">
      {visible.map(({ field, index }, visibleIndex) => {
        const meta = confidenceMeta(field.confidence);
        const isActive = activeFieldIndex === index;

        return (
          <motion.button
            key={`${field.label}-${index}`}
            type="button"
            id={`field-${index}`}
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reducedMotion ? 0 : visibleIndex * 0.04 }}
            className={`naskh-field-card ${isActive ? "naskh-field-card-active" : ""} ${meta.warn ? "naskh-field-card-review" : ""}`}
            onMouseEnter={() => {
              onFieldSelect(index);
              onActiveSnippet(field.source.snippet);
            }}
            onMouseLeave={() => {
              onFieldSelect(null);
              onActiveSnippet(null);
            }}
            onClick={() => {
              onFieldSelect(index);
              onActiveSnippet(field.source.snippet);
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="naskh-section-label">{field.field_type}</p>
              <span className={`naskh-confidence-badge ${meta.warn ? "naskh-confidence-badge-warn" : ""}`}>
                {meta.label}
              </span>
            </div>
            <p className="mt-1 font-semibold" dir="auto">
              {field.label}
            </p>
            <p
              className={`mt-2 text-sm ${/[\u0600-\u06FF]/.test(field.value) ? "naskh-arabic text-base" : ""}`}
              dir="auto"
              style={{ color: "var(--text-muted)" }}
            >
              {field.value}
            </p>
            <div className="naskh-confidence">
              <span>{Math.round(field.confidence * 100)}%</span>
              <div className="naskh-confidence-bar">
                <div
                  className={`naskh-confidence-fill ${meta.warn ? "naskh-confidence-fill-warn" : ""}`}
                  style={{ width: `${Math.round(field.confidence * 100)}%` }}
                />
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
});
