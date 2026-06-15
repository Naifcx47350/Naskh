import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, FileWarning, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useReducedMotion } from "../hooks/useReducedMotion";
import { matchFieldBySnippet, snippetVerticalRatio } from "../lib/documentIntel";
import type { DocumentExtraction } from "../types";

export function DocumentViewer({
  previewUrls,
  activeSnippet,
  activeFieldIndex,
  onSnippetClick,
  extraction,
  contentType,
  filename,
}: {
  previewUrls: string[];
  activeSnippet: string | null;
  activeFieldIndex: number | null;
  onSnippetClick?: (fieldIndex: number) => void;
  extraction: DocumentExtraction | null;
  contentType?: string;
  filename?: string;
}) {
  const reducedMotion = useReducedMotion();
  const [page, setPage] = useState(0);
  const [scale, setScale] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);

  const pageCount = previewUrls.length;
  const currentUrl = previewUrls[page] ?? null;

  const isTextPdfPreview = contentType === "application/pdf";

  const highlightRatio = useMemo(() => {
    if (!activeSnippet || !extraction) return null;
    const field =
      activeFieldIndex != null ? extraction.fields[activeFieldIndex] : null;
    const snippet = field?.source.snippet ?? activeSnippet;
    return snippetVerticalRatio(extraction.transcription, snippet);
  }, [activeSnippet, activeFieldIndex, extraction]);

  useEffect(() => {
    setPage(0);
    setScale(1);
  }, [previewUrls]);

  useEffect(() => {
    if (activeFieldIndex != null && extraction?.fields[activeFieldIndex]?.source.page) {
      const targetPage = extraction.fields[activeFieldIndex].source.page - 1;
      if (targetPage >= 0 && targetPage < pageCount) setPage(targetPage);
    }
  }, [activeFieldIndex, extraction, pageCount]);

  useEffect(() => {
    if (!activeSnippet) return;
    if (scale < 1.05) setScale(1.2);
    const viewport = viewportRef.current;
    if (!viewport || highlightRatio == null) return;
    const targetTop = Math.max(0, highlightRatio * viewport.scrollHeight - viewport.clientHeight / 2);
    viewport.scrollTo({ top: targetTop, behavior: reducedMotion ? "auto" : "smooth" });
  }, [activeSnippet, highlightRatio, reducedMotion, scale]);

  function zoom(delta: number) {
    setScale((value) => Math.min(2.5, Math.max(0.5, Math.round((value + delta) * 10) / 10)));
  }

  const highlightStyle =
    highlightRatio != null
      ? { top: `${Math.max(8, highlightRatio * 100 - 6)}%`, height: "12%" }
      : { top: "35%", height: "18%" };

  return (
    <div className="naskh-viewer">
      <div className="naskh-viewer-toolbar">
        <div className="naskh-viewer-info">
          <span className="naskh-info-chip">{filename ?? "Document"}</span>
          {pageCount > 0 && <span className="naskh-info-chip">Page {page + 1} / {pageCount}</span>}
          {isTextPdfPreview && (
            <span className="naskh-info-chip naskh-info-chip-warn">
              <FileWarning size={12} /> Text preview mode
            </span>
          )}
        </div>
        <div className="naskh-viewer-controls">
          <button type="button" className="naskh-icon-btn" onClick={() => zoom(-0.15)} aria-label="Zoom out">
            <ZoomOut size={16} />
          </button>
          <span className="naskh-zoom-label">{Math.round(scale * 100)}%</span>
          <button type="button" className="naskh-icon-btn" onClick={() => zoom(0.15)} aria-label="Zoom in">
            <ZoomIn size={16} />
          </button>
          {pageCount > 1 && (
            <>
              <button type="button" className="naskh-icon-btn" disabled={page <= 0} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                <ChevronLeft size={16} />
              </button>
              <button type="button" className="naskh-icon-btn" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      <div ref={viewportRef} className="naskh-viewer-viewport">
        {currentUrl ? (
          <motion.div
            className="naskh-viewer-canvas"
            animate={{ scale }}
            transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 30 }}
          >
            <img
              src={currentUrl}
              alt={`Document page ${page + 1}`}
              className={`naskh-viewer-image ${activeSnippet ? "naskh-viewer-image-active" : ""}`}
              draggable={false}
            />
            <AnimatePresence>
              {activeSnippet && (
                <motion.button
                  type="button"
                  key={activeSnippet}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: reducedMotion ? 0 : 0.35 }}
                  className="naskh-viewer-highlight naskh-viewer-highlight-positioned"
                  style={highlightStyle}
                  onClick={() => {
                    if (!extraction) return;
                    const index = matchFieldBySnippet(extraction.fields, activeSnippet);
                    if (index != null) onSnippetClick?.(index);
                  }}
                  aria-label="Jump to related field"
                >
                  <span className="naskh-viewer-highlight-pulse" />
                  <span className="naskh-viewer-highlight-label">Cited region</span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="naskh-viewer-empty">No preview available</div>
        )}
      </div>

      <AnimatePresence>
        {activeSnippet && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: reducedMotion ? 0 : 0.3 }}
            className="naskh-viewer-snippet"
          >
            <p className="naskh-viewer-snippet-label">Cited passage</p>
            <p dir="auto">{activeSnippet}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
