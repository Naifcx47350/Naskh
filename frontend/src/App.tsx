import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Download,
  FileText,
  Highlighter,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  UploadCloud,
  WandSparkles,
} from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

type SourceRegion = { page: number; snippet: string };
type ExtractedField = {
  label: string;
  value: string;
  field_type: string;
  source: SourceRegion;
  confidence: number;
};
type DocumentExtraction = {
  document_kind: string;
  language: string;
  summary: string;
  transcription: string;
  fields: ExtractedField[];
  notes: string[];
};
type UploadResponse = {
  document_id: string;
  filename: string;
  content_type: string;
  preview_urls: string[];
};
type ChatMessage = { role: "user" | "assistant"; content: string; sources?: SourceRegion[] };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      throw new Error(parsed.detail ?? text);
    } catch {
      throw new Error(text || "Request failed");
    }
  }
  return response.json() as Promise<T>;
}

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

        <UploadSection
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
                    <p dir="auto">{activeSnippet}</p>
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
                    <h2 className="mt-1 text-2xl font-bold" dir="auto">{extraction.document_kind}</h2>
                    <p className="mt-1 text-sm text-slate-600" dir="auto">{extraction.summary}</p>
                  </div>
                  {upload && (
                    <div className="flex gap-2">
                      <a className="naskh-btn-secondary px-3 py-2 text-xs" href={`${API_BASE}/api/documents/${upload.document_id}/export/docx`}><Download size={14} /> DOCX</a>
                      <a className="naskh-btn-secondary px-3 py-2 text-xs" href={`${API_BASE}/api/documents/${upload.document_id}/export/json`}><Download size={14} /> JSON</a>
                    </div>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {extraction.fields.map((field, index) => (
                    <motion.button
                      key={`${field.label}-${index}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="naskh-field-card"
                      onMouseEnter={() => setActiveSnippet(field.source.snippet)}
                      onMouseLeave={() => setActiveSnippet(null)}
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

                <div>
                  <label className="mb-2 block text-sm font-semibold text-ink">Editable transcription</label>
                  <textarea
                    dir={isArabic ? "rtl" : "ltr"}
                    value={transcription}
                    onChange={(e) => setTranscription(e.target.value)}
                    className={`min-h-[180px] w-full resize-y rounded-2xl border border-copper/20 bg-parchment p-4 outline-none ring-copper/20 focus:ring-4 ${isArabic ? "naskh-arabic" : "text-base"}`}
                  />
                </div>

                {extraction.notes.length > 0 && (
                  <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-semibold">Human review notes</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {extraction.notes.map((note, i) => <li key={i} dir="auto">{note}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <AssistantPanel
        documentId={upload?.document_id}
        disabled={!extraction}
        onSources={(sources) => setActiveSnippet(sources[0]?.snippet ?? null)}
      />
    </div>
  );
}

function UploadSection({
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

function ProcessingState() {
  const steps = ["Building preview", "Extracting fields", "Transcribing Arabic", "Indexing assistant"];
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-3xl bg-ink p-8 text-white">
      <Loader2 className="mb-4 h-10 w-10 animate-spin text-copper" />
      <h3 className="text-2xl font-semibold">Digitizing document</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-white/70">Running vision extraction and preparing cited answers.</p>
      <div className="mt-8 w-full max-w-md space-y-2">
        {steps.map((step, i) => (
          <motion.div key={step} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.15 }} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-copper/25 text-xs font-bold text-copper">{i + 1}</span>
            {step}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AssistantPanel({
  documentId,
  disabled,
  onSources,
}: {
  documentId?: string;
  disabled: boolean;
  onSources: (sources: SourceRegion[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!question.trim() || !documentId || disabled) return;
    const userQuestion = question.trim();
    setQuestion("");
    setMessages((m) => [...m, { role: "user", content: userQuestion }]);
    setLoading(true);
    try {
      const data = await api<{ answer: { answer: string; source_snippets: SourceRegion[] } }>(`/api/documents/${documentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userQuestion }),
      });
      onSources(data.answer.source_snippets);
      setMessages((m) => [...m, { role: "assistant", content: data.answer.answer, sources: data.answer.source_snippets }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: err instanceof Error ? err.message : "Chat failed" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} className="naskh-chat-panel">
            <div className="flex items-center gap-3 bg-gradient-to-r from-ink to-slate-700 p-4 text-white">
              <Bot />
              <div>
                <p className="font-semibold">Naskh Assistant</p>
                <p className="text-xs text-white/70">{disabled ? "Process the document to enable chat" : "Ask about this document"}</p>
              </div>
            </div>
            <div className="max-h-72 space-y-2 overflow-auto p-4">
              {messages.length === 0 && (
                <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-600">Try: What is the document title? What action is required?</p>
              )}
              {messages.map((msg, i) => (
                <div key={i} dir="auto" className={`rounded-xl p-3 text-sm ${msg.role === "user" ? "ml-6 bg-ink text-white" : "mr-6 bg-slate-100 text-ink"}`}>
                  {msg.content}
                  {msg.sources?.length ? (
                    <button type="button" className="mt-2 text-xs font-semibold text-copper" onClick={() => onSources(msg.sources ?? [])}>Highlight source</button>
                  ) : null}
                </div>
              ))}
              {loading && <p className="text-sm text-slate-500"><Loader2 className="mr-1 inline animate-spin" size={14} />Thinking…</p>}
            </div>
            <form onSubmit={submit} className="flex gap-2 border-t border-slate-100 p-3">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={disabled || !documentId}
                placeholder={disabled ? "Process document first" : "Ask about this document…"}
                className="min-w-0 flex-1 rounded-full bg-slate-100 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-copper/20 disabled:opacity-50"
              />
              <button type="submit" disabled={disabled || loading || !documentId} className="rounded-full bg-copper p-3 text-white disabled:opacity-40">
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <button type="button" className="naskh-assistant-fab" onClick={() => setOpen((v) => !v)}>
        <MessageCircle /> {open ? "Hide assistant" : "Ask Naskh"}
      </button>
    </div>
  );
}
