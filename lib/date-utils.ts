export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(dateObj: Date): string {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTodayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, delta: number): string {
  const dt = parseISODate(iso);
  dt.setDate(dt.getDate() + delta);
  return toISODate(dt);
}

export function getMondayOfWeek(iso: string): string {
  const dt = parseISODate(iso);
  const day = dt.getDay();
  // Monday as first day of week: Sunday = 0 -> -6, Monday = 1 -> 0, etc.
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return toISODate(dt);
}

export function formatShortDate(iso: string): string {
  const dt = parseISODate(iso);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatFullDate(iso: string): string {
  const dt = parseISODate(iso);
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatWeekRange(mondayIso: string): string {
  const sundayIso = addDays(mondayIso, 6);
  const mDt = parseISODate(mondayIso);
  const sDt = parseISODate(sundayIso);

  const mMonth = mDt.toLocaleDateString("en-US", { month: "short" });
  const sMonth = sDt.toLocaleDateString("en-US", { month: "short" });
  const year = sDt.getFullYear();

  if (mMonth === sMonth) {
    return `${mMonth} ${mDt.getDate()} – ${sDt.getDate()}, ${year}`;
  }
  return `${mMonth} ${mDt.getDate()} – ${sMonth} ${sDt.getDate()}, ${year}`;
}

export function getWeekDays(mondayIso: string) {
  const days = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (let i = 0; i < 7; i++) {
    const iso = addDays(mondayIso, i);
    const dt = parseISODate(iso);
    days.push({
      iso,
      shortName: dayNames[i],
      dayNum: dt.getDate(),
    });
  }
  return days;
}
