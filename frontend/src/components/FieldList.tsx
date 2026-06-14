import { motion } from "framer-motion";

import type { ExtractedField } from "../types";

export function FieldList({
  fields,
  onActiveSnippet,
}: {
  fields: ExtractedField[];
  onActiveSnippet: (snippet: string | null) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field, index) => (
        <motion.button
          key={`${field.label}-${index}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="naskh-field-card"
          onMouseEnter={() => onActiveSnippet(field.source.snippet)}
          onMouseLeave={() => onActiveSnippet(null)}
        >
          <p className="text-xs uppercase tracking-wide text-slate-400">{field.field_type}</p>
          <p className="mt-1 font-semibold" dir="auto">{field.label}</p>
          <p className="mt-2 text-sm text-slate-700" dir="auto">{field.value}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-copper" style={{ width: `${Math.round(field.confidence * 100)}%` }} />
          </div>
        </motion.button>
      ))}
    </div>
  );
}
