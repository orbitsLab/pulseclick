/**
 * Minimal iCalendar (RFC 5545) reader.
 *
 * "Integration: Subscribe to calendars and integrate with other apps like
 * Notion." — the clone supports subscribing to any public ICS feed and
 * importing its events as scheduled tasks.
 */

export interface IcsEvent {
  uid: string;
  summary: string;
  description?: string | null;
  location?: string | null;
  /** YYYY-MM-DD */
  startDate: string | null;
  /** HH:mm */
  startTime: string | null;
  /** YYYY-MM-DD */
  endDate: string | null;
  /** HH:mm */
  endTime: string | null;
  allDay: boolean;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Unfold RFC 5545 line continuations (a leading space continues the line). */
export function unfoldIcs(text: string): string[] {
  const raw = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const lines: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length) {
      lines[lines.length - 1] += line.slice(1);
    } else if (line.trim()) {
      lines.push(line);
    }
  }
  return lines;
}

function parseIcsDate(value: string): {
  date: string | null;
  time: string | null;
  allDay: boolean;
} {
  // 20260115 or 20260115T090000Z or 20260115T090000
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return { date: null, time: null, allDay: false };
  const date = `${m[1]}-${m[2]}-${m[3]}`;
  if (!m[4]) return { date, time: null, allDay: true };
  return { date, time: `${m[4]}:${m[5]}`, allDay: false };
}

function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

/** Extract every VEVENT from an ICS document. */
export function parseIcs(text: string): IcsEvent[] {
  const lines = unfoldIcs(text);
  const events: IcsEvent[] = [];
  let current: Partial<IcsEvent> & { _start?: string; _end?: string } | null = null;

  const flush = () => {
    if (!current) return;
    const start = parseIcsDate(current._start ?? "");
    const end = parseIcsDate(current._end ?? "");
    events.push({
      uid: current.uid ?? `${current.summary ?? "event"}-${start.date ?? ""}`,
      summary: current.summary ?? "Untitled event",
      description: current.description ?? null,
      location: current.location ?? null,
      startDate: start.date,
      startTime: start.time,
      endDate: end.date ?? start.date,
      endTime: end.time,
      allDay: start.allDay,
    });
    current = null;
  };

  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (upper === "END:VEVENT") {
      flush();
      continue;
    }
    if (!current) continue;

    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const rawName = line.slice(0, separator);
    const value = line.slice(separator + 1);
    const name = rawName.split(";")[0].toUpperCase();

    switch (name) {
      case "UID":
        current.uid = value.trim();
        break;
      case "SUMMARY":
        current.summary = unescapeText(value);
        break;
      case "DESCRIPTION":
        current.description = unescapeText(value);
        break;
      case "LOCATION":
        current.location = unescapeText(value);
        break;
      case "DTSTART":
        current._start = value.trim();
        break;
      case "DTEND":
        current._end = value.trim();
        break;
      default:
        break;
    }
  }

  flush();
  return events;
}

/** Duration of an event in minutes, when both ends are known. */
export function eventDurationMinutes(event: IcsEvent): number {
  if (!event.startDate || !event.endDate) return 0;
  const start = new Date(`${event.startDate}T${event.startTime ?? "00:00"}:00`);
  const end = new Date(`${event.endDate}T${event.endTime ?? "00:00"}:00`);
  const diff = Math.round((end.getTime() - start.getTime()) / 60000);
  return diff > 0 ? diff : 0;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
