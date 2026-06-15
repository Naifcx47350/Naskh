import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, FileWarning, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useReducedMotion } from "../hooks/useReducedMotion";
import { matchFieldBySnippet, resolveHighlightRegion } from "../lib/documentIntel";
import type { DocumentExtraction } from "../types";

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;

export function DocumentViewer({
  previewUrls,
  activeSnippet,
  activeFieldIndex,
  onSnippetClick,
  extraction,
  filename,
  textPreviewMode = false,
}: {
  previewUrls: string[];
  activeSnippet: string | null;
  activeFieldIndex: number | null;
  onSnippetClick?: (fieldIndex: number) => void;
  extraction: DocumentExtraction | null;
  filename?: string;
  textPreviewMode?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const [page, setPage] = useState(0);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [altPanning, setAltPanning] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const lastPointer = useRef({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const pageCount = previewUrls.length;
  const currentUrl = previewUrls[page] ?? null;

  const highlightRegion = useMemo(
    () => resolveHighlightRegion(extraction, activeFieldIndex, activeSnippet, page),
    [extraction, activeFieldIndex, activeSnippet, page],
  );

  const displaySnippet = useMemo(() => {
    if (!activeSnippet || !extraction) return activeSnippet;
    if (activeFieldIndex != null) return extraction.fields[activeFieldIndex]?.source.snippet ?? activeSnippet;
    const index = matchFieldBySnippet(extraction.fields, activeSnippet);
    return index != null ? extraction.fields[index].source.snippet : activeSnippet;
  }, [activeSnippet, activeFieldIndex, extraction]);

  useEffect(() => {
    setPage(0);
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [previewUrls]);

  useEffect(() => {
    if (activeFieldIndex != null && extraction?.fields[activeFieldIndex]?.source.page) {
      const targetPage = extraction.fields[activeFieldIndex].source.page - 1;
      if (targetPage >= 0 && targetPage < pageCount) setPage(targetPage);
    }
  }, [activeFieldIndex, extraction, pageCount]);

  const scrollHighlightIntoView = useCallback(() => {
    if (!highlightRegion || !viewportRef.current || !imageRef.current) return;
    const viewport = viewportRef.current;
    const img = imageRef.current;
    const targetX = (highlightRegion.x + highlightRegion.width / 2) * img.clientWidth * scale + pan.x;
    const targetY = (highlightRegion.y + highlightRegion.height / 2) * img.clientHeight * scale + pan.y;
    viewport.scrollTo({
      left: Math.max(0, targetX - viewport.clientWidth / 2),
      top: Math.max(0, targetY - viewport.clientHeight / 2),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [highlightRegion, pan.x, pan.y, reducedMotion, scale]);

  useEffect(() => {
    if (!activeSnippet) return;
    if (scale < 1.05) setScale(1.15);
    scrollHighlightIntoView();
  }, [activeSnippet, highlightRegion, page, scrollHighlightIntoView]);

  function clampScale(value: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(value * 10) / 10));
  }

  function zoom(delta: number, clientX?: number, clientY?: number) {
    setScale((current) => {
      const next = clampScale(current + delta);
      const viewport = viewportRef.current;
      if (!viewport || clientX == null || clientY == null) return next;
      const rect = viewport.getBoundingClientRect();
      const px = clientX - rect.left + viewport.scrollLeft;
      const py = clientY - rect.top + viewport.scrollTop;
      const ratio = next / current;
      setPan((p) => ({
        x: px - (px - p.x) * ratio,
        y: py - (py - p.y) * ratio,
      }));
      return next;
    });
  }

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const target = viewport;

    function onNativeWheel(event: WheelEvent) {
      event.preventDefault();
      event.stopPropagation();

      if (event.altKey) {
        const delta = event.deltaY < 0 ? 0.12 : -0.12;
        zoom(delta, event.clientX, event.clientY);
        return;
      }

      // Keep wheel movement inside the preview instead of bubbling to the page.
      target.scrollLeft += event.deltaX;
      target.scrollTop += event.deltaY;
    }

    target.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => target.removeEventListener("wheel", onNativeWheel);
  });


  function onPointerDown(event: React.PointerEvent) {
    if (scale <= 1 && !event.altKey) return;
    setDragging(true);
    dragStart.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent) {
    lastPointer.current = { x: event.clientX, y: event.clientY };
    if (event.altKey && scale > 1 && !dragging) {
      setAltPanning(true);
      setPan((p) => ({
        x: p.x - event.movementX,
        y: p.y - event.movementY,
      }));
      return;
    }
    if (!dragging) return;
    setPan({
      x: dragStart.current.panX + (event.clientX - dragStart.current.x),
      y: dragStart.current.panY + (event.clientY - dragStart.current.y),
    });
  }

  function onPointerUp(event: React.PointerEvent) {
    setDragging(false);
    setAltPanning(false);
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  }

  const highlightStyle = highlightRegion
    ? {
        left: `${highlightRegion.x * 100}%`,
        top: `${highlightRegion.y * 100}%`,
        width: `${highlightRegion.width * 100}%`,
        height: `${highlightRegion.height * 100}%`,
      }
    : undefined;

  return (
    <div className="naskh-viewer">
      <div className="naskh-viewer-toolbar">
        <div className="naskh-viewer-info">
          <span className="naskh-info-chip">{filename ?? "Document"}</span>
          {pageCount > 0 && <span className="naskh-info-chip">Page {page + 1} / {pageCount}</span>}
          {textPreviewMode && (
            <span className="naskh-info-chip naskh-info-chip-warn">
              <FileWarning size={12} /> Text preview mode
            </span>
          )}
          {scale > 1 && (
            <span className="naskh-info-chip">Wheel stays in viewer · Alt+wheel to zoom</span>
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

      <div
        ref={viewportRef}
        className={`naskh-viewer-viewport ${dragging || altPanning ? "naskh-viewer-viewport-grabbing" : "naskh-viewer-viewport-grabbable"}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {currentUrl ? (
          <div
            className="naskh-viewer-transform"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: "0 0",
              transition: reducedMotion || dragging || altPanning ? "none" : "transform 0.15s ease-out",
            }}
          >
            <div className="naskh-viewer-page">
              <img
                ref={imageRef}
                src={currentUrl}
                alt={`Document page ${page + 1}`}
                className={`naskh-viewer-image ${activeSnippet ? "naskh-viewer-image-active" : ""}`}
                draggable={false}
              />
              <AnimatePresence>
                {activeSnippet && highlightStyle && (
                  <motion.button
                    type="button"
                    key={`${page}-${displaySnippet}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.25 }}
                    className={`naskh-viewer-highlight naskh-viewer-highlight-positioned ${highlightRegion?.approximate ? "naskh-viewer-highlight-approx" : ""}`}
                    style={highlightStyle}
                    onClick={() => {
                      if (!extraction) return;
                      const index = matchFieldBySnippet(extraction.fields, activeSnippet);
                      if (index != null) onSnippetClick?.(index);
                    }}
                    aria-label="Jump to related field"
                  >
                    <span className="naskh-viewer-highlight-pulse" />
                    <span className="naskh-viewer-highlight-label">
                      {highlightRegion?.approximate ? "Approx. source" : "Cited region"}
                    </span>
                    {displaySnippet && (
                      <span className="naskh-viewer-passage-overlay" dir="auto">
                        {displaySnippet}
                      </span>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="naskh-viewer-empty">No preview available</div>
        )}
      </div>
    </div>
  );
}
