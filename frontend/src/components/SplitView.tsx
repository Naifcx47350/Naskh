import { AnimatePresence, motion } from "framer-motion";
import { Download, FileText, Highlighter, WandSparkles } from "lucide-react";

import { API_BASE } from "../lib/api";
import type { DocumentExtraction, UploadResponse } from "../types";
import { FieldList } from "./FieldList";
import { ProcessingState } from "./ProcessingState";

export function SplitView({
  previewUrl,
  activeSnippet,
  onActiveSnippet,
  isProcessing,
  extraction,
  transcription,
  onTranscriptionChange,
  isArabic,
  upload,
}: {
  previewUrl: string | null;
  activeSnippet: string | null;
  onActiveSnippet: (snippet: string | null) => void;
  isProcessing: boolean;
  extraction: DocumentExtraction | null;
  transcription: string;
  onTranscriptionChange: (value: string) => void;
  isArabic: boolean;
  upload: UploadResponse | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="naskh-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="naskh-panel-title">Original document</h2>
            <p className="naskh-panel-sub">Hover fields or chat citations to highlight sources.</p>
          </div>
          {activeSnippet && <span className="naskh-pill"><Highlighter size={12} /> Highlighted</span>}
        </div>
        <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-slate-100 to-parchment">
          {previewUrl ? (
            <motion.img key={previewUrl} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} src={previewUrl} alt="Document preview" className="max-h-[500px] w-auto rounded-xl shadow-2xl ring-1 ring-black/10" />
          ) : (
            <div className="text-center text-slate-400">
              <FileText className="mx-auto mb-3 h-10 w-10" />
              <p>Upload or load the demo sample to preview.</p>
            </div>
          )}
          <AnimatePresence>
            {activeSnippet && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute inset-x-6 top-6 rounded-2xl border border-copper bg-white/95 p-4 text-sm shadow-glow">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-copper">Cited passage</p>
                <p>{activeSnippet}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="naskh-card p-5">
        {isProcessing ? (
          <ProcessingState />
        ) : !extraction ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center text-center text-slate-500">
            <WandSparkles className="mb-4 h-12 w-12 text-copper" />
            <p className="text-lg font-semibold text-ink">Ready for extraction</p>
            <p className="mt-2 max-w-sm text-sm">Process the document to reveal structured fields, editable transcription, and review notes.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">Digitized output</p>
                <h2 className="mt-1 text-2xl font-bold">{extraction.document_kind}</h2>
                <p className="mt-1 text-sm text-slate-600">{extraction.summary}</p>
              </div>
              {upload && (
                <div className="flex gap-2">
                  <a className="naskh-btn-secondary px-3 py-2 text-xs" href={`${API_BASE}/api/documents/${upload.document_id}/export/docx`}><Download size={14} /> DOCX</a>
                  <a className="naskh-btn-secondary px-3 py-2 text-xs" href={`${API_BASE}/api/documents/${upload.document_id}/export/json`}><Download size={14} /> JSON</a>
                </div>
              )}
            </div>

            <FieldList fields={extraction.fields} onActiveSnippet={onActiveSnippet} />

            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">Editable transcription</label>
              <textarea
                dir={isArabic ? "rtl" : "ltr"}
                value={transcription}
                onChange={(e) => onTranscriptionChange(e.target.value)}
                className={`min-h-[180px] w-full resize-y rounded-2xl border border-copper/20 bg-parchment p-4 outline-none ring-copper/20 focus:ring-4 ${isArabic ? "naskh-arabic" : "text-base"}`}
              />
            </div>

            {extraction.notes.length > 0 && (
              <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Human review notes</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {extraction.notes.map((note, i) => <li key={i}>{note}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
