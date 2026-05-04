"use client";

import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addNote } from "@/app/actions/notes";
import type { NoteRow } from "@/lib/types";

export function NotesLog({
  quoteId,
  notes,
  compact,
}: {
  quoteId: string;
  notes: NoteRow[];
  compact?: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sorted = [...notes].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const res = await addNote(quoteId, text);
      if (res && typeof res === "object" && "error" in res && res.error) {
        setErr(res.error);
        return;
      }
      setText("");
      router.refresh();
    });
  }

  if (compact) {
    const latest = sorted[sorted.length - 1];
    return (
      <p className="max-w-xs truncate text-xs text-zinc-400" title={latest?.body}>
        {latest ? latest.body : "—"}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-zinc-300">Notes</h3>
      <ul className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
        {sorted.length === 0 && <li className="text-sm text-zinc-500">No notes yet.</li>}
        {sorted.map((n) => (
          <li key={n.id} className="border-b border-zinc-800/80 pb-3 last:border-0 last:pb-0">
            <p className="text-xs text-zinc-500">
              {format(parseISO(n.created_at), "d MMM yyyy, HH:mm")}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">{n.body}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="space-y-2">
        {err && <p className="text-sm text-red-400">{err}</p>}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Add a note…"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-40"
        >
          {pending ? "Saving…" : "Add note"}
        </button>
      </form>
    </div>
  );
}
