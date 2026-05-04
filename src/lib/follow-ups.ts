import { addDays, format, isBefore, isEqual, isSameDay, parseISO, startOfDay } from "date-fns";
import type { FollowUpOffset } from "./types";

export const FOLLOW_UP_OFFSETS: FollowUpOffset[] = [3, 7, 14, 21];

export function followUpDatesFromSentDate(sent: Date): Map<FollowUpOffset, string> {
  const map = new Map<FollowUpOffset, string>();
  for (const offset of FOLLOW_UP_OFFSETS) {
    map.set(offset, format(addDays(sent, offset), "yyyy-MM-dd"));
  }
  return map;
}

export type FollowUpUrgency = "overdue" | "today" | "upcoming" | "none";

export function nextFollowUpInfo(
  followUpDates: string[],
  reference: Date = new Date()
): { nextDate: string | null; urgency: FollowUpUrgency; daysUntil: number | null } {
  const today = startOfDay(reference);
  const sorted = [...followUpDates].filter(Boolean).sort();

  if (sorted.length === 0) {
    return { nextDate: null, urgency: "none", daysUntil: null };
  }

  const parsed = sorted.map((d) => ({ raw: d, date: startOfDay(parseISO(d)) }));

  const upcomingOrToday = parsed.find((p) => !isBefore(p.date, today));
  if (upcomingOrToday) {
    const d = upcomingOrToday.date;
    if (isSameDay(d, today)) {
      return {
        nextDate: upcomingOrToday.raw,
        urgency: "today",
        daysUntil: 0,
      };
    }
    const daysUntil = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return {
      nextDate: upcomingOrToday.raw,
      urgency: "upcoming",
      daysUntil,
    };
  }

  const lastPast = parsed.filter((p) => isBefore(p.date, today) || isEqual(p.date, today)).pop();
  if (lastPast) {
    const daysUntil = Math.round(
      (lastPast.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      nextDate: lastPast.raw,
      urgency: "overdue",
      daysUntil,
    };
  }

  return { nextDate: null, urgency: "none", daysUntil: null };
}

export function isFollowUpOverdue(dateStr: string, reference: Date = new Date()): boolean {
  const d = startOfDay(parseISO(dateStr));
  return isBefore(d, startOfDay(reference));
}

export function isFollowUpToday(dateStr: string, reference: Date = new Date()): boolean {
  return isSameDay(startOfDay(parseISO(dateStr)), startOfDay(reference));
}
