import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, WandSparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AssistantPanel, type AssistantPanelHandle } from "./components/AssistantPanel";
import { ShortcutsModal } from "./components/ShortcutsModal";
import { SplitView } from "./components/SplitView";
import { EmptyWorkspace } from "./components/Skeletons";
import { ThemeToggle } from "./components/ThemeToggle";
import { Toast } from "./components/Toast";
import { UploadZone } from "./components/UploadZone";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useTheme } from "./hooks/useTheme";
import { api, API_BASE } from "./lib/api";
import { buildSuggestedQuestions, matchFieldBySnippet } from "./lib/documentIntel";
import type { DocumentExtraction, SourceRegion, UploadResponse } from "./types";

export default function App() {
  const { toggle: toggleTheme } = useTheme();
  const [upload, setUpload] = useState<UploadResponse | null>(null);
  const [extraction, setExtraction] = useState<DocumentExtraction | null>(null);
  const [transcription, setTranscription] = useState("");
  const [activeSnippet, setActiveSnippet] = useState<string | null>(null);
  const [activeFieldIndex, setActiveFieldIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendReady, setBackendReady] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [showReviewOnly, setShowReviewOnly] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const skipPersistRef = useRef(true);
  const assistantRef = useRef<AssistantPanelHandle>(null);

  const previewUrls = useMemo(() => {
    if (!upload?.preview_urls.length) return [];
    return upload.preview_urls.map((url) => `${API_BASE}${url}`);
  }, [upload]);

  const suggestedQuestions = useMemo(
    () => (extraction ? buildSuggestedQuestions(extraction) : []),
    [extraction],
  );

  const focusCitation = useCallback(
    (sources: SourceRegion[], hasCitation: boolean) => {
      if (!hasCitation || !sources.length) {
        setActiveSnippet(null);
        setActiveFieldIndex(null);
        return;
      }
      const snippet = sources[0]?.snippet ?? null;
      setActiveSnippet(snippet);
      if (extraction && snippet) {
        setActiveFieldIndex(matchFieldBySnippet(extraction.fields, snippet));
      }
    },
    [extraction],
  );

  useEffect(() => {
    api<{ status: string; ai_ready?: boolean }>("/api/health")
      .then((data) => {
        setBackendReady(true);
        setAiReady(Boolean(data.ai_ready));
      })
      .catch(() => {
        setBackendReady(false);
        setAiReady(false);
      });
  }, []);

  useEffect(() => {
    if (extraction) {
      setTranscription(extraction.transcription);
      skipPersistRef.current = true;
    }
  }, [extraction]);

  useEffect(() => {
    if (!upload?.document_id || !extraction) return;
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      api(`/api/documents/${upload.document_id}/extraction`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcription }),
      }).catch(() => undefined);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [transcription, upload?.document_id, extraction]);

  useKeyboardShortcuts(
    {
      onToggleTheme: toggleTheme,
      onToggleAssistant: () => {
        if (assistantOpen) {
          setAssistantOpen(false);
        } else {
          assistantRef.current?.focusInput();
        }
      },
      onProcess: () => void processDocument(),
      onShowShortcuts: () => setShortcutsOpen(true),
    },
    true,
  );

  function resetWorkspaceState() {
    setActiveSnippet(null);
    setActiveFieldIndex(null);
    setShowReviewOnly(false);
  }

  async function loadSample(sampleId: string) {
    setError(null);
    setExtraction(null);
    resetWorkspaceState();
    setLoadingSampleId(sampleId);
    try {
      const data = await api<UploadResponse>(`/api/samples/${sampleId}/load`, { method: "POST" });
      setUpload(data);
      if (data.extraction) setExtraction(data.extraction);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sample load failed");
    } finally {
      setLoadingSampleId(null);
    }
  }

  async function handleUpload(file: File) {
    setError(null);
    setExtraction(null);
    resetWorkspaceState();
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
  const hasWorkspace = Boolean(upload && extraction);

  return (
    <div className="naskh-bg">
      <div className="naskh-bg-glow" />
      <Toast message={error} onDismiss={() => setError(null)} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <div className="naskh-container flex flex-col gap-6">
        <header className="naskh-card p-6 sm:p-8 lg:p-10">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="naskh-pill"><Sparkles size={14} /> Naskh document intelligence</span>
              <span className={`naskh-pill ${backendReady ? "naskh-pill-success" : ""}`}>
                <CheckCircle2 size={14} /> {backendReady ? (aiReady ? "AI ready" : "Gallery offline-ready") : "Backend offline"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="naskh-theme-toggle" onClick={() => setShortcutsOpen(true)} aria-label="Keyboard shortcuts" title="Shortcuts (?)">
                ?
              </button>
              <ThemeToggle />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
            <div>
              <h1 className="naskh-hero-title">Digitize Arabic rules.<br />Ask the document.</h1>
              <p className="naskh-hero-body">
                Human-in-the-loop first pass for Saudi business documents — structured fields, editable Arabic text, and cited answers with live source highlights.
              </p>
            </div>
            <div className="naskh-hero-accent">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <WandSparkles />
                </div>
                <div>
                  <p className="font-semibold">Demo-locked gallery path</p>
                  <p className="text-sm text-white/75">Pick a sample → ask a question → watch the source light up.</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <UploadZone
          upload={upload}
          extraction={extraction}
          isUploading={isUploading}
          onUpload={handleUpload}
          onProcess={processDocument}
          onSelectSample={loadSample}
          loadingSampleId={loadingSampleId}
        />

        {!hasWorkspace && !isProcessing && !loadingSampleId && !isUploading && previewUrls.length === 0 && <EmptyWorkspace />}

        {(hasWorkspace || isProcessing || previewUrls.length > 0) && (
          <SplitView
            previewUrls={previewUrls}
            activeSnippet={activeSnippet}
            activeFieldIndex={activeFieldIndex}
            onActiveSnippet={setActiveSnippet}
            onFieldSelect={setActiveFieldIndex}
            isProcessing={isProcessing}
            extraction={extraction}
            transcription={transcription}
            onTranscriptionChange={setTranscription}
            isArabic={isArabic}
            upload={upload}
            showReviewOnly={showReviewOnly}
            onToggleReviewOnly={() => setShowReviewOnly((value) => !value)}
          />
        )}
      </div>

      <AssistantPanel
        ref={assistantRef}
        documentId={upload?.document_id}
        disabled={!extraction || !aiReady}
        disabledReason={
          !extraction ? "Load a sample to enable chat" : !aiReady ? "Set OPENAI_API_KEY for live chat" : undefined
        }
        suggestedQuestions={suggestedQuestions}
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
        onFocusCitation={focusCitation}
      />
    </div>
  );
}

