import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { useRef } from "react";

import { API_BASE } from "../lib/api";
import { needsReview, reviewCount } from "../lib/documentIntel";
import type { DocumentExtraction, UploadResponse } from "../types";
import { DocumentViewer } from "./DocumentViewer";
import { FieldList } from "./FieldList";
import { InsightsStrip } from "./InsightsStrip";
import { ProcessingState } from "./ProcessingState";
import { ReviewBanner } from "./ReviewBanner";
import { FieldListSkeleton, ViewerSkeleton } from "./Skeletons";

export function SplitView({
  previewUrls,
  activeSnippet,
  activeFieldIndex,
  onActiveSnippet,
  onFieldSelect,
  isProcessing,
  extraction,
  transcription,
  onTranscriptionChange,
  isArabic,
  upload,
  showReviewOnly,
  onToggleReviewOnly,
}: {
  previewUrls: string[];
  activeSnippet: string | null;
  activeFieldIndex: number | null;
  onActiveSnippet: (snippet: string | null) => void;
  onFieldSelect: (index: number | null) => void;
  isProcessing: boolean;
  extraction: DocumentExtraction | null;
  transcription: string;
  onTranscriptionChange: (value: string) => void;
  isArabic: boolean;
  upload: UploadResponse | null;
  showReviewOnly: boolean;
  onToggleReviewOnly: () => void;
}) {
  const fieldListRef = useRef<HTMLDivElement>(null);

  function jumpToFirstReview() {
    if (!extraction) return;
    const index = extraction.fields.findIndex((field) => needsReview(field.confidence));
    if (index < 0) return;
    onFieldSelect(index);
    onActiveSnippet(extraction.fields[index].source.snippet);
    document.getElementById(`field-${index}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="naskh-card p-5 sm:p-6">
        <div className="mb-4">
          <p className="naskh-section-label">Source</p>
          <h2 className="naskh-panel-title">Original document</h2>
          <p className="naskh-panel-sub">Hover fields or chat citations to sync highlights in the viewer.</p>
        </div>

        {isProcessing ? (
          <ViewerSkeleton />
        ) : previewUrls.length > 0 ? (
          <DocumentViewer
            previewUrls={previewUrls}
            activeSnippet={activeSnippet}
            activeFieldIndex={activeFieldIndex}
            onSnippetClick={onFieldSelect}
            extraction={extraction}
            contentType={upload?.content_type}
            filename={upload?.filename}
          />
        ) : null}
      </section>

      <section className="naskh-card p-5 sm:p-6">
        {isProcessing ? (
          <div className="space-y-5">
            <ProcessingState />
            <FieldListSkeleton />
          </div>
        ) : !extraction ? (
          <div className="naskh-empty-state min-h-[420px]">
            <p className="naskh-empty-state-title">Output will appear here</p>
            <p className="mt-2 max-w-sm text-sm">Select a sample from the gallery or process an upload.</p>
          </div>
        ) : (
          <motion.div
            key={upload?.document_id ?? "results"}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            <InsightsStrip extraction={extraction} pageCount={previewUrls.length} />

            <ReviewBanner
              fieldCount={extraction.fields.length}
              reviewFields={reviewCount(extraction.fields)}
              showReviewOnly={showReviewOnly}
              onToggleReviewOnly={onToggleReviewOnly}
              onJumpToReview={jumpToFirstReview}
            />

            <div className="flex flex-wrap gap-2">
              {upload && (
                <>
                  <a className="naskh-btn-secondary px-3 py-2 text-xs" href={`${API_BASE}/api/documents/${upload.document_id}/export/docx`}>
                    <Download size={14} /> DOCX
                  </a>
                  <a className="naskh-btn-secondary px-3 py-2 text-xs" href={`${API_BASE}/api/documents/${upload.document_id}/export/json`}>
                    <Download size={14} /> JSON
                  </a>
                  <a className="naskh-btn-secondary px-3 py-2 text-xs" href={`${API_BASE}/api/documents/${upload.document_id}/export/csv`}>
                    <Download size={14} /> CSV
                  </a>
                </>
              )}
            </div>

            <FieldList
              ref={fieldListRef}
              fields={extraction.fields}
              activeFieldIndex={activeFieldIndex}
              showReviewOnly={showReviewOnly}
              onActiveSnippet={onActiveSnippet}
              onFieldSelect={onFieldSelect}
            />

            <div>
              <label className="mb-2 block text-sm font-semibold" htmlFor="transcription-editor">
                Editable transcription
              </label>
              <textarea
                id="transcription-editor"
                dir={isArabic ? "rtl" : "ltr"}
                value={transcription}
                onChange={(e) => onTranscriptionChange(e.target.value)}
                className={`naskh-transcription ${isArabic ? "naskh-arabic" : "text-base"}`}
              />
            </div>

            {extraction.notes.length > 0 && (
              <div className="naskh-notes">
                <p className="font-semibold">Human review notes</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {extraction.notes.map((note, i) => (
                    <li key={i} dir="auto">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </section>
    </div>
  );
}
