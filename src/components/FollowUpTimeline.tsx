import { format, parseISO } from "date-fns";
import type { FollowUpRow } from "@/lib/types";
import { isFollowUpOverdue, isFollowUpToday } from "@/lib/follow-ups";

const ORDER = [3, 7, 14, 21] as const;

export function FollowUpTimeline({ rows }: { rows: FollowUpRow[] }) {
  const byOffset = new Map(rows.map((r) => [r.day_offset, r]));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-300">Follow-up timeline</h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {ORDER.map((day) => {
          const row = byOffset.get(day);
          const dateStr = row?.follow_up_date;
          const overdue = dateStr ? isFollowUpOverdue(dateStr) : false;
          const today = dateStr ? isFollowUpToday(dateStr) : false;

          return (
            <li
              key={day}
              className={`rounded-lg border px-3 py-2 text-sm ${
                dateStr && overdue
                  ? "border-red-500/50 bg-red-500/10 text-red-100"
                  : dateStr && today
                    ? "border-orange-500/50 bg-orange-500/10 text-orange-100"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-300"
              }`}
            >
              <span className="font-medium text-zinc-200">Day {day}</span>
              <span className="ml-2 text-zinc-400">
                {dateStr ? format(parseISO(dateStr), "d MMM yyyy") : "—"}
              </span>
              {dateStr && overdue && (
                <span className="ml-2 text-xs font-semibold uppercase text-red-300">Overdue</span>
              )}
              {dateStr && today && !overdue && (
                <span className="ml-2 text-xs font-semibold uppercase text-orange-200">Today</span>
              )}
            </li>
          );
        })}
      </ul>
      {!rows.length && (
        <p className="text-sm text-zinc-500">Set a quote sent date to generate follow-up milestones.</p>
      )}
    </div>
  );
}
