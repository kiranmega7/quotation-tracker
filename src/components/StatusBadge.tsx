import type { QuoteStatus } from "@/lib/types";

const styles: Record<QuoteStatus, string> = {
  Quoted: "bg-sky-500/15 text-sky-300 ring-sky-500/40",
  "Closed Won": "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40",
  "Closed Lost": "bg-red-500/15 text-red-300 ring-red-500/40",
  "Checking With Supplier": "bg-amber-500/15 text-amber-200 ring-amber-500/40",
  "Part Number Issue": "bg-orange-500/15 text-orange-200 ring-orange-500/40",
  "Not Found": "bg-zinc-600/40 text-zinc-300 ring-zinc-500/40",
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {status === "Checking With Supplier" ? "Checking" : status}
    </span>
  );
}
