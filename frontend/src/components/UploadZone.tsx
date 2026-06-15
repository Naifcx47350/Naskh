import { motion } from "framer-motion";
import { ArrowRight, FileUp, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

import type { DocumentExtraction, UploadResponse } from "../types";

export function UploadZone({
  upload,
  extraction,
  isUploading,
  onUpload,
  onProcess,
}: {
  upload: UploadResponse | null;
  extraction: DocumentExtraction | null;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onProcess: () => void;
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
          <p className="naskh-section-label">Live upload</p>
          <h2 className="naskh-panel-title">Or upload your own file</h2>
          <p className="naskh-panel-sub">Secondary path for the “real AI on a fresh file” moment.</p>
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
          Requires API key to process. PNG/JPEG recommended on Windows without Poppler.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {extraction ? "Live extraction ready — review, chat, or export." : upload ? "Preview loaded — run AI extraction when ready." : "Upload after choosing a gallery sample, or on its own."}
        </p>
        <button type="button" className="naskh-btn-primary" onClick={onProcess} disabled={!upload || isUploading}>
          <Sparkles size={16} /> Process with AI <ArrowRight size={16} />
        </button>
      </div>
    </motion.section>
  );
}
