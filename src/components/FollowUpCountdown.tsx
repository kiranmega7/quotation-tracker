import { format, parseISO } from "date-fns";
import type { FollowUpUrgency } from "@/lib/follow-ups";

const urgencyClass: Record<FollowUpUrgency, string> = {
  overdue: "bg-red-500/15 text-red-300 ring-red-500/40",
  today: "bg-orange-500/15 text-orange-200 ring-orange-500/40",
  upcoming: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40",
  none: "bg-zinc-700/50 text-zinc-400 ring-zinc-600",
};

export function FollowUpCountdown({
  nextDate,
  urgency,
  daysUntil,
}: {
  nextDate: string | null;
  urgency: FollowUpUrgency;
  daysUntil: number | null;
}) {
  if (!nextDate || urgency === "none") {
    return <span className="text-xs text-zinc-500">—</span>;
  }

  const label =
    urgency === "overdue"
      ? `Overdue (${Math.abs(daysUntil ?? 0)}d)`
      : urgency === "today"
        ? "Due today"
        : daysUntil === 1
          ? "1 day"
          : `${daysUntil} days`;

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${urgencyClass[urgency]}`}
      >
        {label}
      </span>
      <span className="text-[11px] text-zinc-500">
        Next: {format(parseISO(nextDate), "d MMM yyyy")}
      </span>
    </div>
  );
}
