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

export interface TaskScheduleData {
  dueDate?: string | null;
  dueTime?: string | null;
  startDate?: string | null;
  startTime?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  durationMinutes?: number | null;
  completed?: boolean;
}

export interface TaskScheduleFormat {
  dateLabel: string;
  timeLabel?: string;
  durationBadge?: string;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueTomorrow: boolean;
  isMultiDay: boolean;
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes >= 1440 && minutes % 1440 === 0) {
    return `${minutes / 1440}d`;
  }
  if (minutes >= 60) {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${hours}h`;
  }
  return `${minutes}m`;
}

export function formatTaskSchedule(task: TaskScheduleData): TaskScheduleFormat | null {
  const startIso = task.startDate || task.dueDate;
  if (!startIso) return null;

  const today = getTodayISO();
  const tomorrow = addDays(today, 1);
  const endIso = task.endDate;

  const isMultiDay = Boolean(endIso && endIso !== startIso);

  const formatSingle = (iso: string) => {
    if (iso === today) return "Today";
    if (iso === tomorrow) return "Tomorrow";
    return formatShortDate(iso);
  };

  let dateLabel = "";
  let durationBadge: string | undefined;

  if (isMultiDay && endIso) {
    const startDt = parseISODate(startIso);
    const endDt = parseISODate(endIso);
    const days = Math.round((endDt.getTime() - startDt.getTime()) / 86400000) + 1;
    dateLabel = `${formatSingle(startIso)} – ${formatSingle(endIso)}`;
    durationBadge = `${Math.max(1, days)}d`;
  } else {
    dateLabel = formatSingle(startIso);
    if (task.durationMinutes && task.durationMinutes > 0) {
      durationBadge = formatDurationMinutes(task.durationMinutes);
    }
  }

  const startTime = task.startTime || task.dueTime;
  const endTime = task.endTime;
  let timeLabel: string | undefined;

  if (startTime && endTime) {
    timeLabel = `${startTime} – ${endTime}`;
  } else if (startTime) {
    timeLabel = `@${startTime}`;
  }

  const effectiveEnd = endIso || task.dueDate || startIso;
  const isOverdue = Boolean(effectiveEnd && effectiveEnd < today && !task.completed);
  const isDueToday = Boolean((startIso === today || endIso === today) && !task.completed);
  const isDueTomorrow = Boolean(startIso === tomorrow && !task.completed);

  return {
    dateLabel,
    timeLabel,
    durationBadge,
    isOverdue,
    isDueToday,
    isDueTomorrow,
    isMultiDay,
  };
}
