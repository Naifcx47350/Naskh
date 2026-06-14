import { ArrowRight, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

import type { UploadResponse } from "../types";

export function UploadZone({
  upload,
  isUploading,
  onUpload,
  onDemo,
  onProcess,
}: {
  upload: UploadResponse | null;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onDemo: () => void;
  onProcess: () => void;
}) {
  const onDrop = useCallback((files: File[]) => { if (files[0]) onUpload(files[0]); }, [onUpload]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "application/pdf": [".pdf"], "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/webp": [".webp"] },
  });

  return (
    <section className="naskh-card p-4">
      <div {...getRootProps()} className={isDragActive ? "naskh-dropzone naskh-dropzone-active" : "naskh-dropzone"}>
        <input {...getInputProps()} />
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-ink text-white shadow-lg">
          {isUploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
        </div>
        <p className="text-xl font-semibold">{upload ? upload.filename : "Drop a PDF or document photo"}</p>
        <p className="text-sm text-slate-500">PNG/JPEG works instantly. PDF preview uses a text fallback when Poppler is missing.</p>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{upload ? "Preview ready — process when you want AI extraction." : "Start with the demo sample for a flawless pitch path."}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="naskh-btn-secondary" onClick={onDemo} disabled={isUploading}>Load demo sample</button>
          <button type="button" className="naskh-btn-primary" onClick={onProcess} disabled={!upload || isUploading}>
            <Sparkles size={16} /> Process document <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
