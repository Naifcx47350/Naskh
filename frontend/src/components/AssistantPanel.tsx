import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, MessageCircle, Send } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import { API_BASE, api } from "../lib/api";
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

  function updateLastAssistant(update: (msg: ChatMessage) => ChatMessage) {
    setMessages((m) => {
      const copy = [...m];
      for (let i = copy.length - 1; i >= 0; i -= 1) {
        if (copy[i].role === "assistant") {
          copy[i] = update(copy[i]);
          break;
        }
      }
      return copy;
    });
  }

  async function fallbackChat(userQuestion: string) {
    const data = await api<{ answer: { answer: string; source_snippets: SourceRegion[] } }>(
      `/api/documents/${documentId}/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userQuestion }),
      },
    );
    onSources(data.answer.source_snippets);
    updateLastAssistant(() => ({
      role: "assistant",
      content: data.answer.answer,
      sources: data.answer.source_snippets,
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!question.trim() || !documentId || disabled) return;
    const userQuestion = question.trim();
    setQuestion("");
    setMessages((m) => [...m, { role: "user", content: userQuestion }, { role: "assistant", content: "" }]);
    setLoading(true);

    let receivedToken = false;
    try {
      const response = await fetch(`${API_BASE}/api/documents/${documentId}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userQuestion }),
      });
      if (!response.ok || !response.body) throw new Error("stream-unavailable");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamErrored = false;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const dataLine = frame.split("\n").find((line) => line.startsWith("data:"));
          if (!dataLine) continue;
          const raw = dataLine.slice(5).trim();
          if (!raw) continue;
          const evt = JSON.parse(raw) as { type: string; value?: unknown };
          if (evt.type === "token") {
            receivedToken = true;
            const token = String(evt.value ?? "");
            updateLastAssistant((msg) => ({ ...msg, content: msg.content + token }));
          } else if (evt.type === "sources") {
            const sources = (evt.value as SourceRegion[]) ?? [];
            onSources(sources);
            updateLastAssistant((msg) => ({ ...msg, sources }));
          } else if (evt.type === "error") {
            streamErrored = true;
          }
        }
      }

      if (streamErrored && !receivedToken) throw new Error("stream-error");
      if (streamErrored) {
        updateLastAssistant((msg) => ({ ...msg, content: msg.content || "The assistant could not complete the answer." }));
      }
    } catch (err) {
      if (receivedToken) {
        updateLastAssistant((msg) => ({ ...msg, content: msg.content || "Chat failed" }));
      } else {
        try {
          await fallbackChat(userQuestion);
        } catch (fallbackErr) {
          updateLastAssistant(() => ({
            role: "assistant",
            content: fallbackErr instanceof Error ? fallbackErr.message : "Chat failed",
          }));
        }
      }
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
                  {msg.role === "assistant" && msg.content === "" ? (
                    <span className="text-slate-400">…</span>
                  ) : (
                    msg.content
                  )}
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
