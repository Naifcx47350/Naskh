import { motion } from "framer-motion";
import { ArrowRight, FileUp, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

import type { DocumentExtraction, UploadResponse } from "../types";
import { SampleGallery } from "./SampleGallery";

export function UploadZone({
  upload,
  extraction,
  isUploading,
  onUpload,
  onProcess,
  onSelectSample,
  loadingSampleId,
}: {
  upload: UploadResponse | null;
  extraction: DocumentExtraction | null;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onProcess: () => void;
  onSelectSample: (sampleId: string) => void;
  loadingSampleId: string | null;
}) {
  const onDrop = useCallback((files: File[]) => {
    if (files[0]) onUpload(files[0]);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
  });

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="naskh-card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="naskh-section-label">Start here</p>
          <h2 className="naskh-panel-title">Upload or pick a sample</h2>
          <p className="naskh-panel-sub">Gallery loads real team PDFs offline. Upload is the live-AI path.</p>
        </div>
        {upload && (
          <span className="naskh-pill naskh-pill-success">
            <FileUp size={12} /> {upload.filename}
          </span>
        )}
      </div>

      <div {...getRootProps()} className={isDragActive ? "naskh-dropzone naskh-dropzone-active" : "naskh-dropzone"}>
        <input {...getInputProps()} />
        <div className="naskh-dropzone-icon">
          {isUploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
        </div>
        <p className="text-lg font-semibold">{upload ? upload.filename : "Drop a PDF or document photo"}</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Requires API key to process. PDF previews rasterize without Poppler.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {extraction ? "Extraction ready — review, chat, or export." : upload ? "Preview loaded — run AI extraction when ready." : "Pick a sample below or upload your own file."}
        </p>
        <button type="button" className="naskh-btn-primary shrink-0" onClick={onProcess} disabled={!upload || isUploading}>
          <Sparkles size={16} /> Process with AI <ArrowRight size={16} />
        </button>
      </div>

      <SampleGallery onSelect={onSelectSample} loadingId={loadingSampleId} />
    </motion.section>
  );
}
