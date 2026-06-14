import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AssistantPanel } from "./components/AssistantPanel";
import { SplitView } from "./components/SplitView";
import { UploadZone } from "./components/UploadZone";
import { api, API_BASE } from "./lib/api";
import type { DocumentExtraction, UploadResponse } from "./types";

export default function App() {
  const [upload, setUpload] = useState<UploadResponse | null>(null);
  const [extraction, setExtraction] = useState<DocumentExtraction | null>(null);
  const [transcription, setTranscription] = useState("");
  const [activeSnippet, setActiveSnippet] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendReady, setBackendReady] = useState(false);

  const previewUrl = useMemo(() => {
    if (!upload?.preview_urls.length) return null;
    return `${API_BASE}${upload.preview_urls[0]}`;
  }, [upload]);

  useEffect(() => {
    api<{ status: string }>("/api/health")
      .then(() => setBackendReady(true))
      .catch(() => setBackendReady(false));
  }, []);

  useEffect(() => {
    if (extraction) setTranscription(extraction.transcription);
  }, [extraction]);

  async function handleUpload(file: File) {
    setError(null);
    setExtraction(null);
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUpload(await api<UploadResponse>("/api/documents/upload", { method: "POST", body: formData }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function loadDemo() {
    setError(null);
    setExtraction(null);
    setIsUploading(true);
    try {
      setUpload(await api<UploadResponse>("/api/documents/demo", { method: "POST" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo load failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function processDocument() {
    if (!upload) return;
    setError(null);
    setIsProcessing(true);
    try {
      const data = await api<{ extraction: DocumentExtraction }>(`/api/documents/${upload.document_id}/process`, {
        method: "POST",
      });
      setExtraction(data.extraction);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setIsProcessing(false);
    }
  }

  const isArabic = /arabic|عربي/i.test(extraction?.language ?? "") || /[\u0600-\u06FF]/.test(transcription);

  return (
    <div className="naskh-bg">
      <div className="naskh-bg-glow" />
      <div className="naskh-container flex flex-col gap-6">
        <header className="naskh-card p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="naskh-pill"><Sparkles size={14} /> Document intelligence MVP</span>
                <span className="naskh-pill"><CheckCircle2 size={14} /> {backendReady ? "Backend connected" : "Backend offline"}</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-ink md:text-6xl">
                Digitize Arabic rules.<br />Ask the document.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Upload a photo or PDF, extract structured fields, review editable Arabic text, and chat with a cited assistant.
              </p>
            </div>
            <div className="rounded-3xl bg-ink p-6 text-white shadow-glow">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <WandSparkles />
                </div>
                <div>
                  <p className="font-semibold">Human-in-the-loop first pass</p>
                  <p className="text-sm text-white/70">Honest AI extraction with operator review.</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <UploadZone
          upload={upload}
          isUploading={isUploading}
          onUpload={handleUpload}
          onDemo={loadDemo}
          onProcess={processDocument}
        />

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </motion.div>
        )}

        <SplitView
          previewUrl={previewUrl}
          activeSnippet={activeSnippet}
          onActiveSnippet={setActiveSnippet}
          isProcessing={isProcessing}
          extraction={extraction}
          transcription={transcription}
          onTranscriptionChange={setTranscription}
          isArabic={isArabic}
          upload={upload}
        />
      </div>

      <AssistantPanel
        documentId={upload?.document_id}
        disabled={!extraction}
        onSources={(sources) => setActiveSnippet(sources[0]?.snippet ?? null)}
      />
    </div>
  );
}
