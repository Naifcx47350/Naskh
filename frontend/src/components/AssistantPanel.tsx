import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, MessageCircle, Send } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import { api } from "../lib/api";
import type { ChatMessage, SourceRegion } from "../types";

export function AssistantPanel({
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
                <div key={i} className={`rounded-xl p-3 text-sm ${msg.role === "user" ? "ml-6 bg-ink text-white" : "mr-6 bg-slate-100 text-ink"}`}>
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
