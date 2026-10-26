/**
 * Natural-language task parsing.
 *
 * Provides intelligent date, time, recurrence, priority, tags, and duration
 * extraction from quick-add task strings.
 *
 * Everything is pure and date-local so it can be reused on the client (live
 * preview while typing) and on the server (authoritative parsing on save).
 */

export type RecurrenceRule =
  | "NONE"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "YEARLY"
  | "CUSTOM";

export interface ParsedTask {
  title: string;
  dueDate?: string | null;
  dueTime?: string | null;
  recurrence?: RecurrenceRule;
  recurrenceInterval?: number;
  recurrenceWeekdays?: string | null;
  recurrenceEndDate?: string | null;
  priority?: number | null;
  tags?: string[];
  durationMinutes?: number | null;
  endTime?: string | null;
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const DAY_MS = 24 * 60 * 60 * 1000;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function addMonths(d: Date, n: number): Date {
  const c = new Date(d);
  const day = c.getDate();
  c.setDate(1);
  c.setMonth(c.getMonth() + n);
  const lastDay = new Date(c.getFullYear(), c.getMonth() + 1, 0).getDate();
  c.setDate(Math.min(day, lastDay));
  return c;
}

/** "5pm" / "5:30pm" / "17:00" / "at 9" -> "HH:mm" */
function parseTimeToken(token: string): string | null {
  const t = token.toLowerCase().trim();
  if (t === "noon") return "12:00";
  if (t === "midnight") return "00:00";
  if (t === "morning") return "09:00";
  if (t === "afternoon") return "14:00";
  if (t === "evening") return "19:00";
  if (t === "night") return "21:00";

  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?$/);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  const meridiem = m[3];
  if (meridiem) {
    if (hour > 12) return null;
    if (meridiem.startsWith("p") && hour !== 12) hour += 12;
    if (meridiem.startsWith("a") && hour === 12) hour = 0;
  }
  if (hour > 23 || minute > 59) return null;
  return `${pad(hour)}:${pad(minute)}`;
}

/** "1h30m", "90m", "2h" -> minutes */
function parseDurationToken(token: string): number | null {
  const t = token.toLowerCase().trim();
  const hm = t.match(/^(?:for\s+)?(\d+)\s*h(?:ours?)?\s*(?:(\d+)\s*m(?:in(?:utes?)?)?)?$/);
  if (hm) return parseInt(hm[1], 10) * 60 + (hm[2] ? parseInt(hm[2], 10) : 0);
  const m = t.match(/^(?:for\s+)?(\d+)\s*m(?:in(?:utes?)?)?$/);
  if (m) return parseInt(m[1], 10);
  const h = t.match(/^(?:for\s+)?(\d+)\s*h(?:ours?)?$/);
  if (h) return parseInt(h[1], 10) * 60;
  return null;
}

function nextWeekday(from: Date, weekday: number, forceNextWeek: boolean): Date {
  const d = startOfDay(from);
  const delta = (weekday - d.getDay() + 7) % 7;
  if (delta === 0) return d;
  if (forceNextWeek) return addDays(d, delta + (7 - delta) + 0) ;
  return addDays(d, delta);
}

/**
 * Parse a raw quick-add string.
 *
 * @param input  user typed text
 * @param now    reference "today" (defaults to the current local time)
 */
export function parseTaskInput(input: string, now: Date = new Date()): ParsedTask {
  const result: ParsedTask = { title: "" };
  let text = ` ${input.trim()} `;
  const consumed: string[] = [];

  const take = (pattern: RegExp, handler: (m: RegExpExecArray) => void) => {
    const m = pattern.exec(text);
    if (!m) return;
    handler(m);
    consumed.push(m[0]);
    text = text.replace(m[0], " ");
  };

  const reference = startOfDay(now);

  // --- Priority markers: !1 !2 !3 and words -----------------------------
  take(/\s!([1-3])(?=\s)/g, (m) => {
    result.priority = parseInt(m[1], 10);
  });
  take(/\s(p[1-3])(?=\s)/gi, (m) => {
    result.priority = parseInt(m[1].slice(1), 10);
  });
  take(/\s(high|medium|low)(?:\s+priority)?(?=\s)/gi, (m) => {
    const w = m[1].toLowerCase();
    result.priority = w === "high" ? 3 : w === "medium" ? 2 : 1;
  });

  // --- Tags: #tag -------------------------------------------------------
  const tags: string[] = [];
  const tagRe = /#([\p{L}\p{N}_-]+)/gu;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = tagRe.exec(text)) !== null) {
    tags.push(tagMatch[1]);
  }
  if (tags.length) {
    text = text.replace(tagRe, " ");
    result.tags = tags;
  }

  // --- Recurrence --------------------------------------------------------
  take(/\b(every\s+day|daily)\b/gi, () => {
    result.recurrence = "DAILY";
    result.recurrenceInterval = 1;
  });
  take(/\b(every\s+year|yearly|annually)\b/gi, () => {
    result.recurrence = "YEARLY";
    result.recurrenceInterval = 1;
  });
  take(/\bevery\s+(\d+)\s+(day|week|month|year)s?\b/gi, (m) => {
    const unit = m[2].toLowerCase();
    result.recurrenceInterval = parseInt(m[1], 10);
    result.recurrence =
      unit === "day"
        ? "DAILY"
        : unit === "week"
        ? "WEEKLY"
        : unit === "month"
        ? "MONTHLY"
        : "YEARLY";
  });
  take(/\b(every\s+week|weekly)\b/gi, () => {
    result.recurrence = "WEEKLY";
    result.recurrenceInterval = 1;
  });
  take(/\b(every\s+month|monthly)\b/gi, () => {
    result.recurrence = "MONTHLY";
    result.recurrenceInterval = 1;
  });
  take(/\bevery\s+(sun|mon|tue|tues|wed|thu|thurs|fri|sat|sunday|monday|tuesday|wednesday|thursday|friday|saturday)s?\b/gi, (m) => {
    const weekday = WEEKDAYS[m[1].toLowerCase()];
    if (weekday === undefined) return;
    result.recurrence = "WEEKLY";
    result.recurrenceInterval = 1;
    result.recurrenceWeekdays = String(weekday);
  });
  take(/\bevery\s+weekday\b/gi, () => {
    result.recurrence = "WEEKLY";
    result.recurrenceInterval = 1;
    result.recurrenceWeekdays = "1,2,3,4,5";
  });
  take(/\bevery\s+day\s+of\s+the\s+month\b/gi, () => {
    result.recurrence = "MONTHLY";
    result.recurrenceInterval = 1;
  });

  // --- Explicit date words ---------------------------------------------
  take(/\btoday\b/gi, () => {
    result.dueDate = toISODate(reference);
  });
  take(/\btonight\b/gi, () => {
    result.dueDate = toISODate(reference);
    result.dueTime = "20:00";
  });
  take(/\btomorrow\b/gi, () => {
    result.dueDate = toISODate(addDays(reference, 1));
  });
  take(/\byesterday\b/gi, () => {
    result.dueDate = toISODate(addDays(reference, -1));
  });
  take(/\bin\s+(\d+)\s+(day|week|month)s?\b/gi, (m) => {
    const n = parseInt(m[1], 10);
    const unit = m[2].toLowerCase();
    const d =
      unit === "day"
        ? addDays(reference, n)
        : unit === "week"
        ? addDays(reference, n * 7)
        : addMonths(reference, n);
    result.dueDate = toISODate(d);
  });
  take(/\bnext\s+week\b/gi, () => {
    result.dueDate = toISODate(addDays(reference, 7));
  });
  take(/\bnext\s+month\b/gi, () => {
    result.dueDate = toISODate(addMonths(reference, 1));
  });
  take(/\bnext\s+year\b/gi, () => {
    result.dueDate = toISODate(addMonths(reference, 12));
  });
  take(/\bnext\s+(sun|mon|tue|tues|wed|thu|thurs|fri|sat|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi, (m) => {
    const weekday = WEEKDAYS[m[1].toLowerCase()];
    if (weekday === undefined) return;
    result.dueDate = toISODate(nextWeekday(reference, weekday, true));
  });
  take(/\b(this\s+)?(sun|mon|tue|tues|wed|thu|thurs|fri|sat|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi, (m) => {
    const weekday = WEEKDAYS[m[2].toLowerCase()];
    if (weekday === undefined) return;
    result.dueDate = toISODate(nextWeekday(reference, weekday, false));
  });
  take(/\bend\s+of\s+(day|eod)\b/gi, () => {
    if (!result.dueDate) result.dueDate = toISODate(reference);
    result.dueTime = "18:00";
  });
  take(/\beod\b/gi, () => {
    if (!result.dueDate) result.dueDate = toISODate(reference);
    result.dueTime = "18:00";
  });
  take(/\bend\s+of\s+week\s*\(([^)]*)\)/gi, (m) => {
    result.dueDate = toISODate(addDays(reference, (5 - reference.getDay() + 7) % 7));
  });
  take(/\bend\s+of\s+week\b/gi, () => {
    result.dueDate = toISODate(addDays(reference, (5 - reference.getDay() + 7) % 7));
    result.dueTime = "18:00";
  });
  take(/\bend\s+of\s+month\b/gi, () => {
    result.dueDate = toISODate(new Date(reference.getFullYear(), reference.getMonth() + 1, 0));
  });
  take(/\bend\s+of\s+year\b/gi, () => {
    result.dueDate = toISODate(new Date(reference.getFullYear(), 11, 31));
  });

  // --- Numeric dates: 2026-01-05 / 12/25 / 25-12 ----------------------
  take(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g, (m) => {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    if (mo < 0 || mo > 11 || d < 1 || d > 31) return;
    result.dueDate = toISODate(new Date(y, mo, d));
  });
  take(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g, (m) => {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    const year = m[3]
      ? parseInt(m[3].length === 2 ? `20${m[3]}` : m[3], 10)
      : reference.getFullYear();
    let month = a - 1;
    let day = b;
    if (a > 12 && b <= 12) {
      month = b - 1;
      day = a;
    }
    if (month < 0 || month > 11 || day < 1 || day > 31) return;
    result.dueDate = toISODate(new Date(year, month, day));
  });
  take(/\b(\d{1,2})-(\d{1,2})\b/g, (m) => {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    let month: number;
    let day: number;
    if (a > 12) {
      day = a;
      month = b - 1;
    } else if (b > 12) {
      month = a - 1;
      day = b;
    } else {
      // Ambiguous: default to the month-first reading.
      month = a - 1;
      day = b;
    }
    if (month < 0 || month > 11 || day < 1 || day > 31) return;
    result.dueDate = toISODate(new Date(reference.getFullYear(), month, day));
  });
  take(/\bon\s+the\s+(\d{1,2})(?:st|nd|rd|th)\b/gi, (m) => {
    const day = parseInt(m[1], 10);
    if (day < 1 || day > 31) return;
    result.recurrence = "MONTHLY";
    result.recurrenceInterval = 1;
    // Next occurrence of that day of the month.
    let candidate = new Date(reference.getFullYear(), reference.getMonth(), day);
    if (candidate < reference) candidate = new Date(reference.getFullYear(), reference.getMonth() + 1, day);
    result.dueDate = toISODate(candidate);
  });
  take(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?\b/gi, (m) => {
    const month = MONTHS[m[1].toLowerCase()];
    if (month === undefined) return;
    const day = parseInt(m[2], 10);
    const year = m[3] ? parseInt(m[3], 10) : reference.getFullYear();
    if (day < 1 || day > 31) return;
    result.dueDate = toISODate(new Date(year, month, day));
  });
  take(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?(?:\s*,?\s*(\d{4}))?\b/gi, (m) => {
    const month = MONTHS[m[2].toLowerCase()];
    if (month === undefined) return;
    const day = parseInt(m[1], 10);
    const year = m[3] ? parseInt(m[3], 10) : reference.getFullYear();
    if (day < 1 || day > 31) return;
    result.dueDate = toISODate(new Date(year, month, day));
  });

  // --- Duration: "for 90m", "2h" ---------------------------------------
  take(/\b(for\s+\d+\s*(?:h|hours?|m|min(?:utes?)?)(?:\s*\d+\s*m(?:in(?:utes?)?)?)?)\b/i, (m) => {
    const minutes = parseDurationToken(m[1]);
    if (minutes === null) return;
    result.durationMinutes = minutes;
  });

  // --- Times ------------------------------------------------------------
  take(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a|p)?)\b/i, (m) => {
    const t = parseTimeToken(m[1]);
    if (t) result.dueTime = t;
  });
  take(/\b(\d{1,2}:\d{2}\s*(?:am|pm)?)\b/i, (m) => {
    const t = parseTimeToken(m[1]);
    if (t) result.dueTime = t;
  });
  take(/\b(\d{1,2}\s*(?:am|pm))\b/i, (m) => {
    const t = parseTimeToken(m[1]);
    if (t) result.dueTime = t;
  });
  take(/\b(noon|midnight|morning|afternoon|evening|night)\b/i, (m) => {
    const t = parseTimeToken(m[1]);
    if (t) result.dueTime = t;
  });

  // Derive an end time from the duration when we know the start time.
  if (result.durationMinutes && result.dueTime) {
    const [hh, mm] = result.dueTime.split(":").map(Number);
    const start = new Date(reference);
    start.setHours(hh, mm, 0, 0);
    const end = new Date(start.getTime() + result.durationMinutes * 60000);
    result.endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
  }

  // Title cleanup.
  const title = text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+(on|at|for|by|in|the|of)\s*$/i, "")
    .trim();
  result.title = title;

  return result;
}

/** Convenience: is there anything worth parsing at all? */
export function hasParsedContent(parsed: ParsedTask): boolean {
  return Boolean(
    parsed.dueDate ||
      parsed.dueTime ||
      parsed.recurrence ||
      parsed.priority ||
      parsed.tags?.length ||
      parsed.durationMinutes
  );
}

export const DAY_MS_EXPORT = DAY_MS;
