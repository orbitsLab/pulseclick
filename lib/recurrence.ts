/**
 * Recurrence engine.
 *
 * TickTick supports "flexible recurring rules (weekly, monthly, yearly, or
 * custom)". A recurring task stays a single row: when it is completed the
 * server advances the due date to the next occurrence instead of creating
 * duplicates, and a completed occurrence is archived in `completedAt`.
 */

export type RecurrenceType =
  | "NONE"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "YEARLY"
  | "CUSTOM";

export interface RecurrenceRule {
  recurrence: string | null | undefined;
  recurrenceInterval?: number | null;
  recurrenceWeekdays?: string | null;
  recurrenceEndDate?: string | null;
}

export interface RecurrenceTarget {
  dueDate: string | null;
  dueTime: string | null;
  startDate: string | null;
  startTime: string | null;
  endDate: string | null;
  endTime: string | null;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
}

function shiftDate(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function shiftMonths(base: Date, months: number): Date {
  const d = new Date(base);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

export function parseWeekdays(value: string | null | undefined): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => parseInt(v.trim(), 10))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}

/**
 * Compute the next occurrence of a recurring task after `from`.
 * Returns null when the recurrence has ended.
 */
export function computeNextOccurrence(
  rule: RecurrenceRule,
  current: RecurrenceTarget,
  from: Date = new Date()
): RecurrenceTarget | null {
  const type = (rule.recurrence || "NONE").toUpperCase() as RecurrenceType;
  if (type === "NONE") return null;

  const interval = Math.max(1, rule.recurrenceInterval || 1);
  const weekdays = parseWeekdays(rule.recurrenceWeekdays);
  const end = parseISODate(rule.recurrenceEndDate);

  const base =
    parseISODate(current.dueDate) ??
    parseISODate(current.startDate) ??
    new Date(from.getFullYear(), from.getMonth(), from.getDate());

  let next: Date | null = null;

  if (type === "DAILY") {
    next = shiftDate(base, interval);
  } else if (type === "WEEKLY") {
    if (weekdays.length) {
      // Custom weekly rule: walk forward to the next selected weekday.
      const candidate = new Date(base);
      candidate.setDate(candidate.getDate() + 1);
      for (let i = 0; i < 14; i += 1) {
        if (weekdays.includes(candidate.getDay())) {
          next = candidate;
          break;
        }
        candidate.setDate(candidate.getDate() + 1);
      }
      if (!next) next = shiftDate(base, 7 * interval);
    } else {
      next = shiftDate(base, 7 * interval);
    }
  } else if (type === "MONTHLY") {
    next = shiftMonths(base, interval);
  } else if (type === "YEARLY" || type === "CUSTOM") {
    next = shiftMonths(base, 12 * interval);
  }

  if (!next) return null;
  if (end && next > end) return null;

  // Never schedule an occurrence in the past relative to `from`.
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (next < today) {
    // Fast-forward using the same rule until we land on today or later.
    let guard = 0;
    while (next < today && guard < 5000) {
      if (type === "DAILY") next = shiftDate(next, interval);
      else if (type === "WEEKLY") next = shiftDate(next, 7 * interval);
      else if (type === "MONTHLY") next = shiftMonths(next, interval);
      else next = shiftMonths(next, 12 * interval);
      guard += 1;
      if (end && next > end) return null;
    }
  }

  const nextISO = toISODate(next);
  const startBase = parseISODate(current.startDate);
  const endBase = parseISODate(current.endDate);

  return {
    dueDate: nextISO,
    dueTime: current.dueTime,
    startDate: startBase ? toISODate(next) : current.startDate,
    startTime: current.startTime,
    endDate: endBase ? toISODate(next) : current.endDate,
    endTime: current.endTime,
  };
}

/** Human readable label for the repeat picker. */
export function describeRecurrence(rule: RecurrenceRule): string {
  const type = (rule.recurrence || "NONE").toUpperCase();
  const interval = Math.max(1, rule.recurrenceInterval || 1);
  const weekdays = parseWeekdays(rule.recurrenceWeekdays);
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  switch (type) {
    case "DAILY":
      return interval === 1 ? "Every day" : `Every ${interval} days`;
    case "WEEKLY":
      if (weekdays.length) {
        return `Every ${weekdays.map((d) => names[d]).join(", ")}`;
      }
      return interval === 1 ? "Every week" : `Every ${interval} weeks`;
    case "MONTHLY":
      return interval === 1 ? "Every month" : `Every ${interval} months`;
    case "YEARLY":
      return interval === 1 ? "Every year" : `Every ${interval} years`;
    case "CUSTOM":
      return "Custom";
    default:
      return "Never";
  }
}
