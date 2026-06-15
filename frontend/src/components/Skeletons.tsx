import { motion } from "framer-motion";
import { FileText, Sparkles } from "lucide-react";

export function ViewerSkeleton() {
  return (
    <div className="naskh-skeleton-viewer" aria-hidden>
      <div className="naskh-skeleton-line w-2/3" />
      <div className="naskh-skeleton-block mt-4" />
      <div className="naskh-skeleton-block mt-3 h-48" />
    </div>
  );
}

export function FieldListSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-hidden>
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="naskh-skeleton-field">
          <div className="naskh-skeleton-line w-1/3" />
          <div className="naskh-skeleton-line mt-3 w-2/3" />
          <div className="naskh-skeleton-line mt-2 w-full" />
        </div>
      ))}
    </div>
  );
}

export function EmptyWorkspace() {
  return (
    <div className="naskh-empty-state">
      <Sparkles className="mb-4 h-12 w-12" style={{ color: "var(--accent)" }} />
      <p className="naskh-empty-state-title">Choose a sample to begin</p>
      <p className="mt-2 max-w-md text-sm">
        Pick a prepared business document from the gallery for an instant, offline-ready demo — or upload your own file for live AI extraction.
      </p>
    </div>
  );
}

export function EmptyViewerHint() {
  return (
    <div className="naskh-empty-state min-h-[360px]">
      <FileText className="mb-3 h-10 w-10" style={{ color: "var(--text-muted)" }} />
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Document preview will appear here.</p>
    </div>
  );
}
