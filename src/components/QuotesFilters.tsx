"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { QUOTE_STATUSES } from "@/lib/constants";
import type { QuoteStatus } from "@/lib/types";

export function QuotesFilters({ initial }: { initial: Record<string, string> }) {
  const router = useRouter();
  const sp = useSearchParams();

  function build(next: Record<string, string | undefined>) {
    const p = new URLSearchParams(sp.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === "") p.delete(k);
      else p.set(k, v);
    });
    return `/quotes?${p.toString()}`;
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="min-w-[180px] flex-1">
          <span className="mb-1 block text-xs text-zinc-500">Search company</span>
          <span className="flex gap-2">
            <input
              id="qt-company-search"
              name="q"
              defaultValue={initial.q ?? ""}
              placeholder="Company name…"
              className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = (e.target as HTMLInputElement).value;
                  router.push(build({ q: v || undefined }));
                }
              }}
            />
            <button
              type="button"
              className="shrink-0 rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
              onClick={() => {
                const el = document.getElementById("qt-company-search") as HTMLInputElement | null;
                router.push(build({ q: el?.value?.trim() || undefined }));
              }}
            >
              Search
            </button>
          </span>
        </label>
        <label className="min-w-[160px]">
          <span className="mb-1 block text-xs text-zinc-500">Status</span>
          <select
            defaultValue={initial.status ?? ""}
            onChange={(e) => router.push(build({ status: e.target.value || undefined }))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="">All</option>
            {QUOTE_STATUSES.map((s: QuoteStatus) => (
              <option key={s} value={s}>
                {s === "Checking With Supplier" ? "Checking" : s}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[140px]">
          <span className="mb-1 block text-xs text-zinc-500">From</span>
          <input
            type="date"
            defaultValue={initial.from ?? ""}
            onChange={(e) => router.push(build({ from: e.target.value || undefined }))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          />
        </label>
        <label className="min-w-[140px]">
          <span className="mb-1 block text-xs text-zinc-500">To</span>
          <input
            type="date"
            defaultValue={initial.to ?? ""}
            onChange={(e) => router.push(build({ to: e.target.value || undefined }))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          />
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            defaultChecked={initial.urgent === "1"}
            onChange={(e) => router.push(build({ urgent: e.target.checked ? "1" : undefined }))}
            className="rounded border-zinc-600"
          />
          Urgent follow-ups only
        </label>
        <label className="min-w-[160px]">
          <span className="mb-1 block text-xs text-zinc-500">Sort by</span>
          <select
            defaultValue={initial.sort ?? "date"}
            onChange={(e) => router.push(build({ sort: e.target.value }))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="date">Date (quote sent)</option>
            <option value="value">Value</option>
            <option value="followup">Follow-up date</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => router.push("/quotes")}
          className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
