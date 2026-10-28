"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  ListTodo,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* -------------------------------------------------------------------------- */
/*                                   Types                                     */
/* -------------------------------------------------------------------------- */

export interface StatsByDay {
  date: string;
  created: number;
  completed: number;
}

export interface StatsByPriority {
  priority: number;
  count: number;
}

export interface StatsByList {
  listId: string | null;
  name: string;
  color?: string | null;
  count: number;
  completed: number;
}

export interface StatsFocusDay {
  date: string;
  minutes: number;
}

export interface StatsHabit {
  title: string;
  color?: string | null;
  streak: number;
  completionRate: number;
  totalLogs: number;
}

export interface StatisticsData {
  range: "week" | "month" | "quarter" | "year";
  tasks: { created: number; completed: number; open: number; completionRate: number };
  byDay: StatsByDay[];
  byPriority: StatsByPriority[];
  byList: StatsByList[];
  focus: { totalMinutes: number; sessions: number; byDay: StatsFocusDay[] };
  habits: { streaks: StatsHabit[]; logs: number };
  busiest: { date: string; count: number }[];
}

export interface StatisticsViewProps {
  stats: StatisticsData;
  range: "week" | "month" | "quarter" | "year";
  onRangeChange: (range: "week" | "month" | "quarter" | "year") => void;
  isLoading?: boolean;
}

type StatsRange = "week" | "month" | "quarter" | "year";

/* -------------------------------------------------------------------------- */
/*                              Theme resolution                               */
/* -------------------------------------------------------------------------- */

interface ThemeVars {
  accent: string;
  text: string;
  muted: string;
  border: string;
  panel: string;
  panelAlt: string;
}

const FALLBACK_THEME: ThemeVars = {
  accent: "#4772fa",
  text: "#191919",
  muted: "#7c8496",
  border: "#e6e9f0",
  panel: "#ffffff",
  panelAlt: "#f2f4f8",
};

const THEME_VAR_NAMES: Record<keyof ThemeVars, string> = {
  accent: "--app-accent",
  text: "--app-text",
  muted: "--app-muted",
  border: "--app-border",
  panel: "--app-panel",
  panelAlt: "--app-panel-alt",
};

function readThemeVars(): ThemeVars {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return FALLBACK_THEME;
  }
  const styles = window.getComputedStyle(document.documentElement);
  const read = (key: keyof ThemeVars): string => {
    const raw = styles.getPropertyValue(THEME_VAR_NAMES[key]).trim();
    return raw || FALLBACK_THEME[key];
  };
  return {
    accent: read("accent"),
    text: read("text"),
    muted: read("muted"),
    border: read("border"),
    panel: read("panel"),
    panelAlt: read("panelAlt"),
  };
}

function useThemeVars(): ThemeVars {
  const [theme, setTheme] = useState<ThemeVars>(FALLBACK_THEME);

  useEffect(() => {
    const sync = () => {
      setTheme((prev) => {
        const next = readThemeVars();
        const changed = (Object.keys(next) as (keyof ThemeVars)[]).some(
          (key) => next[key] !== prev[key]
        );
        return changed ? next : prev;
      });
    };

    sync();

    // Theme changes are applied by writing CSS variables onto <html>; observe
    // those mutations and also poll as a safety net.
    let observer: MutationObserver | null = null;
    if (typeof MutationObserver !== "undefined") {
      observer = new MutationObserver(() => sync());
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-app-theme", "data-app-mode", "class", "style"],
      });
    }

    const interval = window.setInterval(sync, 3000);

    return () => {
      observer?.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return theme;
}

/* -------------------------------------------------------------------------- */
/*                                Helpers                                      */
/* -------------------------------------------------------------------------- */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const RANGE_OPTIONS: { id: StatsRange; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
  { id: "year", label: "Year" },
];

const PRIORITY_META: Record<number, { label: string; color: string }> = {
  3: { label: "High", color: "#ef4444" },
  2: { label: "Medium", color: "#f59e0b" },
  1: { label: "Low", color: "#4772fa" },
  0: { label: "None", color: "#94a3b8" },
};

const PRIORITY_ORDER = [3, 2, 1, 0];

function formatDayLabel(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return iso;
  const monthLabel = MONTHS[month - 1];
  if (!monthLabel) return iso;
  return `${monthLabel} ${day}`;
}

function formatMinutes(totalMinutes: number): string {
  const safe = Number.isFinite(totalMinutes) ? Math.max(0, Math.round(totalMinutes)) : 0;
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  return `${hours}h ${minutes}m`;
}

/**
 * Normalise a rate that may arrive as a fraction (0..1) or as a percent
 * (0..100) into an integer percent.
 */
function toPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const percent = value <= 1 ? value * 100 : value;
  return Math.min(100, Math.max(0, Math.round(percent)));
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

/* -------------------------------------------------------------------------- */
/*                            Small presentational                            */
/* -------------------------------------------------------------------------- */

function SectionCard({
  title,
  icon,
  subtitle,
  children,
  action,
}: {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 shadow-sm transition-colors">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--app-panel-alt)] text-[var(--app-muted)]">
            {icon}
          </span>
          <div>
            <h3 className="app-heading font-semibold text-[var(--app-text)]">{title}</h3>
            {subtitle ? (
              <p className="app-label text-[var(--app-muted)]">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-panel-alt)]/60 px-4 py-8 text-center">
      <Sparkles className="h-4 w-4 text-[var(--app-muted)]" />
      <p className="app-label text-[var(--app-muted)]">{message}</p>
    </div>
  );
}

function DonutGauge({ percent, accent }: { percent: number; accent: string }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamp(percent, 0, 100) / 100);

  return (
    <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90" aria-hidden="true">
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="#e6e9f0"
        strokeWidth="5"
        className="dark:stroke-[var(--app-border)]"
      />
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke={accent}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Main component                                 */
/* -------------------------------------------------------------------------- */

export function StatisticsView({ stats, range, onRangeChange, isLoading }: StatisticsViewProps) {
  const theme = useThemeVars();

  const byDay = useMemo(() => safeArray(stats?.byDay), [stats]);
  const byPriority = useMemo(() => safeArray(stats?.byPriority), [stats]);
  const byList = useMemo(() => safeArray(stats?.byList), [stats]);
  const focusByDay = useMemo(() => safeArray(stats?.focus?.byDay), [stats]);
  const habitStreaks = useMemo(() => safeArray(stats?.habits?.streaks), [stats]);
  const busiestDays = useMemo(() => safeArray(stats?.busiest), [stats]);

  const tasks = stats?.tasks ?? {
    created: 0,
    completed: 0,
    open: 0,
    completionRate: 0,
  };
  const focus = stats?.focus ?? { totalMinutes: 0, sessions: 0, byDay: [] };
  const habits = stats?.habits ?? { streaks: [], logs: 0 };

  const completionPercent = toPercent(tasks.completionRate);

  const activityData = useMemo(
    () =>
      byDay.map((entry) => ({
        label: formatDayLabel(entry.date),
        created: Math.max(0, entry.created ?? 0),
        completed: Math.max(0, entry.completed ?? 0),
      })),
    [byDay]
  );

  const priorityData = useMemo(
    () =>
      PRIORITY_ORDER.map((priority) => {
        const found = byPriority.find((entry) => entry.priority === priority);
        return {
          priority,
          name: PRIORITY_META[priority].label,
          color: PRIORITY_META[priority].color,
          count: found?.count ?? 0,
        };
      }).filter((entry) => entry.count > 0),
    [byPriority]
  );

  const focusData = useMemo(
    () =>
      focusByDay.map((entry) => ({
        label: formatDayLabel(entry.date),
        minutes: Math.max(0, entry.minutes ?? 0),
      })),
    [focusByDay]
  );

  const topBusiest = useMemo(
    () =>
      [...busiestDays]
        .filter((entry) => Boolean(entry?.date))
        .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
        .slice(0, 5),
    [busiestDays]
  );

  const tooltipStyle = useMemo(
    () => ({
      contentStyle: {
        backgroundColor: theme.panel,
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        color: theme.text,
        fontSize: 12,
      },
      labelStyle: { color: theme.text, fontWeight: 700, marginBottom: 4 },
      itemStyle: { color: theme.text },
    }),
    [theme]
  );

  const axisTick = { fill: theme.muted, fontSize: 11 };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2 space-y-4 pb-12">
      {/* Header + range switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="app-body text-[var(--app-muted)]">
            {isLoading
              ? "Refreshing your insights…"
              : `A snapshot of your productivity for this ${range}.`}
          </p>
        </div>

        <div
          className="inline-flex w-full items-center gap-1 self-start rounded-xl border border-[var(--app-border)] bg-[var(--app-panel-alt)] p-1 sm:w-auto"
          role="tablist"
          aria-label="Statistics range"
        >
          {RANGE_OPTIONS.map((option) => {
            const active = option.id === range;
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onRangeChange(option.id)}
                className={`flex-1 rounded-lg px-3 py-1.5 app-label font-semibold transition-all sm:flex-none ${ active ? "text-white shadow-md" : "text-[var(--app-muted)] hover:text-[var(--app-text)] dark:text-[var(--app-muted)] dark:hover:text-white" }`}
                style={active ? { backgroundColor: theme.accent } : undefined}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Tasks completed"
          value={tasks.completed ?? 0}
          accent={theme.accent}
          accentBackground={theme.panelAlt}
          hint="Finished in range"
        />
        <KpiCard
          icon={<ListTodo className="h-4 w-4" />}
          label="Tasks created"
          value={tasks.created ?? 0}
          accent={theme.muted}
          accentBackground={theme.panelAlt}
          hint="Added in range"
        />
        <KpiCard
          icon={<Target className="h-4 w-4" />}
          label="Open tasks"
          value={tasks.open ?? 0}
          accent={theme.muted}
          accentBackground={theme.panelAlt}
          hint="Still to do"
        />

        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] p-4 shadow-sm transition-colors">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 app-label font-medium text-[var(--app-muted)]">
              <TrendingUp className="h-4 w-4" />
              Completion rate
            </span>
            <span className="app-figure font-semibold text-[var(--app-text)]">
              {completionPercent}%
            </span>
            <span className="app-meta text-[var(--app-muted)]">
              Completed vs created
            </span>
          </div>
          <DonutGauge percent={completionPercent} accent={theme.accent} />
        </div>
      </div>

      {/* Activity chart */}
      <SectionCard
        title="Activity"
        subtitle="Tasks created vs completed"
        icon={<BarChart3 className="h-4 w-4" />}
      >
        {activityData.length === 0 ? (
          <EmptyState message="No activity yet — create a task to start your trend." />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke={theme.border} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: theme.panelAlt }}
                  contentStyle={tooltipStyle.contentStyle}
                  labelStyle={tooltipStyle.labelStyle}
                  itemStyle={tooltipStyle.itemStyle}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: theme.text, paddingTop: 8 }}
                />
                <Bar
                  dataKey="created"
                  name="Created"
                  fill={theme.muted}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                />
                <Bar
                  dataKey="completed"
                  name="Completed"
                  fill={theme.accent}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>

      {/* Priority + Focus */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Priority mix"
          subtitle="Where your tasks land"
          icon={<Target className="h-4 w-4" />}
        >
          {priorityData.length === 0 ? (
            <EmptyState message="No prioritised tasks in this range." />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {priorityData.map((entry) => (
                      <Cell key={entry.priority} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle.contentStyle}
                    labelStyle={tooltipStyle.labelStyle}
                    itemStyle={tooltipStyle.itemStyle}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, color: theme.text, paddingTop: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Focus time"
          subtitle="Minutes of deep work"
          icon={<Clock className="h-4 w-4" />}
          action={
            <span className="rounded-lg bg-[var(--app-panel-alt)] px-2 py-1 app-meta font-bold text-[var(--app-text)]">
              {formatMinutes(focus.totalMinutes ?? 0)}
            </span>
          }
        >
          {focusData.length === 0 ? (
            <EmptyState message="No focus sessions recorded in this range." />
          ) : (
            <>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={focusData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke={theme.border} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={axisTick}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      unit="m"
                    />
                    <Tooltip
                      cursor={{ fill: theme.panelAlt }}
                      contentStyle={tooltipStyle.contentStyle}
                      labelStyle={tooltipStyle.labelStyle}
                      itemStyle={tooltipStyle.itemStyle}
                    />
                    <Bar
                      dataKey="minutes"
                      name="Minutes"
                      fill={theme.accent}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={26}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-[var(--app-panel-alt)] p-3">
                  <span className="app-overline font-semibold tracking-wide text-[var(--app-muted)]">
                    Total focus
                  </span>
                  <p className="mt-1 app-title font-semibold text-[var(--app-text)]">
                    {formatMinutes(focus.totalMinutes ?? 0)}
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--app-panel-alt)] p-3">
                  <span className="app-overline font-semibold tracking-wide text-[var(--app-muted)]">
                    Sessions
                  </span>
                  <p className="mt-1 app-title font-semibold text-[var(--app-text)]">
                    {focus.sessions ?? 0}
                  </p>
                </div>
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Lists breakdown */}
      <SectionCard
        title="Lists"
        subtitle="Tasks and completions per list"
        icon={<ListTodo className="h-4 w-4" />}
      >
        {byList.length === 0 ? (
          <EmptyState message="No list activity yet." />
        ) : (
          <div className="space-y-3">
            {byList.map((entry, index) => {
              const count = Math.max(0, entry.count ?? 0);
              const completed = Math.max(0, entry.completed ?? 0);
              const percent = count > 0 ? clamp((completed / count) * 100, 0, 100) : 0;
              const dotColor = entry.color || theme.accent;

              return (
                <div key={entry.listId ?? `list-${index}`} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2 app-label font-medium text-[var(--app-text)]">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span className="truncate">{entry.name || "Untitled list"}</span>
                    </span>
                    <span className="shrink-0 app-meta text-[var(--app-muted)]">
                      {completed}/{count}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--app-panel-alt)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${percent}%`, backgroundColor: dotColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Habits + busiest days */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Habits"
          subtitle={`${habits.logs ?? 0} total logs`}
          icon={<Flame className="h-4 w-4" />}
        >
          {habitStreaks.length === 0 ? (
            <EmptyState message="No habit activity yet — start a streak today." />
          ) : (
            <div className="space-y-3">
              {habitStreaks.map((habit, index) => (
                <div
                  key={`${habit.title}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-[var(--app-panel-alt)] p-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: habit.color || theme.accent }}
                    />
                    <div className="min-w-0">
                      <p className="truncate app-label font-semibold text-[var(--app-text)]">
                        {habit.title || "Untitled habit"}
                      </p>
                      <p className="app-meta text-[var(--app-muted)]">
                        {toPercent(habit.completionRate)}% complete · {habit.totalLogs ?? 0} logs
                      </p>
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-lg bg-[var(--app-panel)] px-2 py-1 app-label font-semibold text-orange-500 shadow-xs dark:text-orange-400">
                    <Flame className="h-3.5 w-3.5" />
                    {habit.streak ?? 0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Busiest days"
          subtitle="Your most productive days"
          icon={<CalendarDays className="h-4 w-4" />}
        >
          {topBusiest.length === 0 ? (
            <EmptyState message="Not enough activity to rank your days." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {topBusiest.map((entry) => (
                <span
                  key={entry.date}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-[var(--app-panel-alt)] px-3 py-1.5 app-label font-medium text-[var(--app-text)]"
                >
                  <Activity className="h-3.5 w-3.5" style={{ color: theme.accent }} />
                  {formatDayLabel(entry.date)} — {entry.count ?? 0}
                </span>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                KPI card                                     */
/* -------------------------------------------------------------------------- */

function KpiCard({
  icon,
  label,
  value,
  hint,
  accent,
  accentBackground,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
  accent: string;
  accentBackground: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] p-4 shadow-sm transition-colors">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: accentBackground, color: accent }}
      >
        {icon}
      </span>
      <span className="mt-1 app-label font-medium text-[var(--app-muted)]">{label}</span>
      <span className="app-figure font-semibold text-[var(--app-text)]">
        {value}
      </span>
      <span className="app-meta text-[var(--app-muted)]">{hint}</span>
    </div>
  );
}
