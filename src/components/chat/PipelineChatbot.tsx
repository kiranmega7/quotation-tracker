"use client";

import { FormEvent, useMemo, useState } from "react";

type UiMessage = {
  role: "user" | "assistant";
  content: string;
};

export function PipelineChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      role: "assistant",
      content:
        "Ask me about overdue follow ups, conversion rate, top-value deals, or what to prioritise today.",
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !isStreaming, [input, isStreaming]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSend) return;

    const userText = input.trim();
    setInput("");
    setError(null);

    const withUser = [...messages, { role: "user", content: userText } as UiMessage];
    setMessages(withUser);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: withUser }),
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Failed to get chatbot response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const clone = [...prev];
          const last = clone[clone.length - 1];
          if (last && last.role === "assistant") {
            clone[clone.length - 1] = { ...last, content: assistantText };
          }
          return clone;
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I hit an issue while connecting. Please try again." },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full border border-zinc-700 bg-zinc-900/95 px-4 py-3 text-sm font-medium text-zinc-100 shadow-xl transition hover:border-sky-500/60 hover:bg-zinc-800"
        >
          Ask your pipeline
        </button>
      )}

      {open && (
        <section className="fixed bottom-6 right-6 z-50 flex h-[70vh] w-[92vw] max-w-md flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl">
          <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-100">Ask me anything about your pipeline</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            >
              Close
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, idx) => (
              <div
                key={`${message.role}-${idx}`}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[85%] rounded-lg bg-sky-600 px-3 py-2 text-sm text-white"
                    : "max-w-[90%] rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                }
              >
                <p className="whitespace-pre-wrap">{message.content || (isStreaming ? "Thinking..." : "")}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-zinc-800 p-3">
            {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={2}
                placeholder="Which deals are overdue today?"
                className="min-h-[56px] flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isStreaming ? "..." : "Send"}
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
