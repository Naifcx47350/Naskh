import { AnimatePresence, motion } from "framer-motion";
import { Bot, Crosshair, Loader2, Send, X } from "lucide-react";
import type { FormEvent } from "react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

import { useReducedMotion } from "../hooks/useReducedMotion";
import { API_BASE, api } from "../lib/api";
import type { ChatMessage, SourceRegion } from "../types";

export type AssistantPanelHandle = {
  focusInput: () => void;
};

export const AssistantPanel = forwardRef<
  AssistantPanelHandle,
  {
    documentId?: string;
    disabled: boolean;
    disabledReason?: string;
    suggestedQuestions: string[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFocusCitation: (sources: SourceRegion[], hasCitation: boolean) => void;
  }
>(function AssistantPanel(
  {
    documentId,
    disabled,
    disabledReason,
    suggestedQuestions,
    open,
    onOpenChange,
    onFocusCitation,
  },
  ref,
) {
  const reducedMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      onOpenChange(true);
      window.setTimeout(() => inputRef.current?.focus(), 50);
    },
  }));

  useEffect(() => {
    setMessages([]);
    setQuestion("");
    if (!documentId) onOpenChange(false);
  }, [documentId, onOpenChange]);

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

  async function ask(userQuestion: string) {
    if (!userQuestion.trim() || !documentId || disabled) return;
    setQuestion("");
    setMessages((m) => [...m, { role: "user", content: userQuestion }, { role: "assistant", content: "" }]);
    setLoading(true);
    onOpenChange(true);

    let receivedToken = false;
    let finalSources: SourceRegion[] = [];

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

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const dataLine = frame.split("\n").find((line) => line.startsWith("data:"));
          if (!dataLine) continue;
          const evt = JSON.parse(dataLine.slice(5).trim()) as { type: string; value?: unknown };
          if (evt.type === "token") {
            receivedToken = true;
            const token = String(evt.value ?? "");
            updateLastAssistant((msg) => ({ ...msg, content: msg.content + token }));
          } else if (evt.type === "sources") {
            finalSources = (evt.value as SourceRegion[]) ?? [];
            updateLastAssistant((msg) => ({ ...msg, sources: finalSources }));
            onFocusCitation(finalSources, finalSources.length > 0);
          } else if (evt.type === "error") {
            throw new Error("stream-error");
          }
        }
      }

      if (!receivedToken) throw new Error("stream-empty");
      if (!finalSources.length) {
        updateLastAssistant((msg) => ({
          ...msg,
          content: `${msg.content}\n\n(No precise source citation available in the document excerpts.)`,
        }));
        onFocusCitation([], false);
      }
    } catch {
      try {
        const data = await api<{ answer: { answer: string; source_snippets: SourceRegion[] } }>(
          `/api/documents/${documentId}/chat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: userQuestion }),
          },
        );
        finalSources = data.answer.source_snippets;
        updateLastAssistant(() => ({
          role: "assistant",
          content: data.answer.answer,
          sources: finalSources,
        }));
        onFocusCitation(finalSources, finalSources.length > 0);
      } catch (fallbackErr) {
        updateLastAssistant(() => ({
          role: "assistant",
          content: fallbackErr instanceof Error ? fallbackErr.message : "Chat failed",
        }));
      }
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await ask(question.trim());
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="naskh-assistant-backdrop md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <div className="naskh-assistant-root" aria-live="polite">
        <AnimatePresence>
          {open && (
            <motion.div
              key="panel"
              initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="naskh-chat-panel"
            >
              <div className="naskh-chat-header">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Bot size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Naskh Assistant</p>
                  <p className="truncate text-xs text-white/75">
                    {disabledReason ?? (disabled ? "Load a sample or process a document" : "Ask about this document")}
                  </p>
                </div>
                <button type="button" className="naskh-chat-close" onClick={() => onOpenChange(false)} aria-label="Close assistant">
                  <X size={18} />
                </button>
              </div>

              <div className="naskh-chat-messages">
                {messages.length === 0 && suggestedQuestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                      Suggested questions
                    </p>
                    {suggestedQuestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className="naskh-suggested-chip"
                        disabled={disabled}
                        onClick={() => ask(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    dir="auto"
                    className={msg.role === "user" ? "naskh-chat-bubble-user" : "naskh-chat-bubble-assistant"}
                  >
                    {msg.role === "assistant" && msg.content === "" && loading ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)] [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)] [animation-delay:300ms]" />
                      </span>
                    ) : (
                      msg.content
                    )}
                    {msg.sources?.length ? (
                      <button
                        type="button"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
                        style={{ color: "var(--accent)" }}
                        onClick={() => onFocusCitation(msg.sources ?? [], true)}
                      >
                        <Crosshair size={12} /> Jump to source
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              <form onSubmit={submit} className="naskh-chat-form">
                <input
                  ref={inputRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={disabled || !documentId}
                  placeholder={disabledReason ?? (disabled ? "Load a sample first" : "Ask about this document…")}
                  className="naskh-chat-input"
                  aria-label="Ask the document assistant"
                />
                <span className="naskh-chat-kbd-hint" aria-hidden="true">Ctrl+K</span>
                <button type="submit" disabled={disabled || loading || !documentId} className="naskh-chat-send" aria-label="Send question">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          className="naskh-assistant-fab"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
          aria-label={open ? "Close assistant" : "Open assistant"}
          title="Open assistant (Ctrl+K)"
        >
          <Bot size={22} />
        </button>
      </div>
    </>
  );
});
