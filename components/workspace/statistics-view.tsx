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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
  stats: StatisticsData | null | undefined;
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
  3: { label: "High", color: "#eb5757" },
  2: { label: "Medium", color: "#dfab01" },
  1: { label: "Low", color: "#2383e2" },
  0: { label: "None", color: "#787774" },
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
    <section className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-4 transition-colors">
      <header className="mb-3.5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[var(--app-hover)] text-[var(--app-muted)]">
            {icon}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-[var(--app-text)]">{title}</h3>
            {subtitle ? (
              <p className="text-xs text-[var(--app-muted)]">{subtitle}</p>
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
    <div className="flex flex-col items-center justify-center gap-2 rounded-[6px] border border-dashed border-[var(--app-border)] bg-[var(--app-hover)]/40 px-4 py-8 text-center">
      <Sparkles className="h-4 w-4 text-[var(--app-muted)]" />
      <p className="text-xs text-[var(--app-muted)]">{message}</p>
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
/*                            Skeleton component                              */
/* -------------------------------------------------------------------------- */

export function StatisticsSkeleton({
  range,
  onRangeChange,
}: {
  range: StatsRange;
  onRangeChange: (r: StatsRange) => void;
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2 space-y-4 pb-12 select-none animate-in fade-in-0 duration-150">
      {/* Header + range switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Skeleton className="h-4 w-32 rounded bg-[var(--app-hover)]" />
          <Skeleton className="h-3 w-48 rounded bg-[var(--app-hover)]" />
        </div>

        <div
          className="inline-flex w-full items-center gap-0.5 self-start rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel)] p-0.5 sm:w-auto"
          role="tablist"
        >
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onRangeChange(option.id)}
              className={cn(
                "flex-1 rounded-[4px] px-2.5 py-1 text-xs font-medium transition-colors sm:flex-none cursor-pointer",
                option.id === range
                  ? "bg-[var(--app-hover)] text-[var(--app-text)] font-semibold shadow-xs"
                  : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 KPI summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2.5 rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-4 w-4 rounded-[4px] bg-[var(--app-hover)]" />
                <Skeleton className="h-3.5 w-24 rounded bg-[var(--app-hover)]" />
              </div>
            </div>
            <Skeleton className="h-7 w-20 rounded bg-[var(--app-hover)] my-0.5" />
            <Skeleton className="h-3 w-28 rounded bg-[var(--app-hover)]" />
          </div>
        ))}
      </div>

      {/* Activity bar chart skeleton */}
      <div className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-4 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--app-border)]/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded bg-[var(--app-hover)]" />
              <Skeleton className="h-4 w-28 rounded bg-[var(--app-hover)]" />
            </div>
            <Skeleton className="h-3 w-44 rounded bg-[var(--app-hover)]" />
          </div>
        </div>

        <div className="h-64 w-full flex items-end gap-3 pt-6 pb-2 px-4 border-b border-[var(--app-border)]/40">
          {[40, 65, 30, 80, 55, 90, 45, 70, 35, 60, 75, 50].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="w-full flex gap-1 items-end justify-center h-48">
                <Skeleton className="w-2.5 sm:w-3.5 rounded-t-[3px] bg-[var(--app-hover)]" style={{ height: `${h}%` }} />
                <Skeleton className="w-2.5 sm:w-3.5 rounded-t-[3px] bg-[var(--app-hover)]/60" style={{ height: `${Math.max(15, h - 20)}%` }} />
              </div>
              <Skeleton className="h-2.5 w-5 sm:w-8 rounded bg-[var(--app-hover)]" />
            </div>
          ))}
        </div>
      </div>

      {/* Priority mix + Focus time 2-column grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Priority mix skeleton */}
        <div className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--app-border)]/60">
            <Skeleton className="h-4 w-4 rounded bg-[var(--app-hover)]" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24 rounded bg-[var(--app-hover)]" />
              <Skeleton className="h-3 w-36 rounded bg-[var(--app-hover)]" />
            </div>
          </div>
          <div className="h-64 flex flex-col items-center justify-center gap-4">
            <div className="relative flex items-center justify-center">
              <Skeleton className="h-36 w-36 rounded-full bg-[var(--app-hover)]" />
              <div className="absolute h-20 w-20 rounded-full bg-[var(--app-panel)]" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-16 rounded bg-[var(--app-hover)]" />
              <Skeleton className="h-3 w-16 rounded bg-[var(--app-hover)]" />
              <Skeleton className="h-3 w-16 rounded bg-[var(--app-hover)]" />
            </div>
          </div>
        </div>

        {/* Focus time skeleton */}
        <div className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--app-border)]/60">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded bg-[var(--app-hover)]" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24 rounded bg-[var(--app-hover)]" />
                <Skeleton className="h-3 w-36 rounded bg-[var(--app-hover)]" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-lg bg-[var(--app-hover)]" />
          </div>
          <div className="h-44 flex items-end gap-3 px-2 border-b border-[var(--app-border)]/40 pb-2">
            {[30, 50, 20, 75, 60, 40, 85].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <Skeleton className="w-full max-w-[28px] rounded-t-[3px] bg-[var(--app-hover)]" style={{ height: `${h}%` }} />
                <Skeleton className="h-2.5 w-6 rounded bg-[var(--app-hover)]" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel-hover)] p-3 space-y-1.5">
              <Skeleton className="h-3 w-20 rounded bg-[var(--app-hover)]" />
              <Skeleton className="h-5 w-16 rounded bg-[var(--app-hover)]" />
            </div>
            <div className="rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel-hover)] p-3 space-y-1.5">
              <Skeleton className="h-3 w-16 rounded bg-[var(--app-hover)]" />
              <Skeleton className="h-5 w-12 rounded bg-[var(--app-hover)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Lists breakdown skeleton */}
      <div className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--app-border)]/60">
          <Skeleton className="h-4 w-4 rounded bg-[var(--app-hover)]" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-20 rounded bg-[var(--app-hover)]" />
            <Skeleton className="h-3 w-40 rounded bg-[var(--app-hover)]" />
          </div>
        </div>
        <div className="space-y-3 pt-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-2.5 w-2.5 rounded-full bg-[var(--app-hover)]" />
                  <Skeleton className="h-3.5 w-32 rounded bg-[var(--app-hover)]" />
                </div>
                <Skeleton className="h-3 w-12 rounded bg-[var(--app-hover)]" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full bg-[var(--app-hover)]" />
            </div>
          ))}
        </div>
      </div>

      {/* Habits + Busiest days skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--app-border)]/60">
            <Skeleton className="h-4 w-4 rounded bg-[var(--app-hover)]" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-20 rounded bg-[var(--app-hover)]" />
              <Skeleton className="h-3 w-28 rounded bg-[var(--app-hover)]" />
            </div>
          </div>
          <div className="space-y-2 pt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel-hover)] p-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-2.5 w-2.5 rounded-full bg-[var(--app-hover)]" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-28 rounded bg-[var(--app-hover)]" />
                    <Skeleton className="h-3 w-20 rounded bg-[var(--app-hover)]" />
                  </div>
                </div>
                <Skeleton className="h-6 w-10 rounded-lg bg-[var(--app-hover)]" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--app-border)]/60">
            <Skeleton className="h-4 w-4 rounded bg-[var(--app-hover)]" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-28 rounded bg-[var(--app-hover)]" />
              <Skeleton className="h-3 w-36 rounded bg-[var(--app-hover)]" />
            </div>
          </div>
          <div className="space-y-2 pt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel-hover)] p-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-3.5 w-3.5 rounded bg-[var(--app-hover)]" />
                  <Skeleton className="h-3.5 w-28 rounded bg-[var(--app-hover)]" />
                </div>
                <Skeleton className="h-3 w-16 rounded bg-[var(--app-hover)]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Main component                                 */
/* -------------------------------------------------------------------------- */

export function StatisticsView({ stats, range, onRangeChange, isLoading }: StatisticsViewProps) {
  if (isLoading || !stats) {
    return <StatisticsSkeleton range={range} onRangeChange={onRangeChange} />;
  }

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
        borderRadius: 6,
        color: theme.text,
        fontSize: 12,
      },
      labelStyle: { color: theme.text, fontWeight: 600, marginBottom: 4 },
      itemStyle: { color: theme.text },
    }),
    [theme]
  );

  const axisTick = { fill: theme.muted, fontSize: 11 };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2 space-y-4 pb-12">
      {/* Header + range switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-[var(--app-muted)]">
            {isLoading
              ? "Refreshing your insights…"
              : `A snapshot of your productivity for this ${range}.`}
          </p>
        </div>

        <div
          className="inline-flex w-full items-center gap-0.5 self-start rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel)] p-0.5 sm:w-auto"
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
                className={`flex-1 rounded-[4px] px-2.5 py-1 text-xs font-medium transition-colors sm:flex-none cursor-pointer ${ active ? "bg-[var(--app-hover)] text-[var(--app-text)] font-semibold shadow-xs" : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover)]/50" }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Tasks completed"
          value={tasks.completed ?? 0}
          accent={theme.accent}
          accentBackground="var(--app-hover)"
          hint="Finished in range"
        />
        <KpiCard
          icon={<ListTodo className="h-4 w-4" />}
          label="Tasks created"
          value={tasks.created ?? 0}
          accent={theme.muted}
          accentBackground="var(--app-hover)"
          hint="Added in range"
        />
        <KpiCard
          icon={<Target className="h-4 w-4" />}
          label="Open tasks"
          value={tasks.open ?? 0}
          accent={theme.muted}
          accentBackground="var(--app-hover)"
          hint="Still to do"
        />

        <div className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3.5 transition-colors">
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--app-muted)]">
              <TrendingUp className="h-3.5 w-3.5" />
              Completion rate
            </span>
            <span className="text-xl font-semibold text-[var(--app-text)] font-mono tabular-nums">
              {completionPercent}%
            </span>
            <span className="text-[11px] text-[var(--app-muted)]">
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
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel-hover)] p-3">
                  <span className="text-[11px] font-mono font-medium tracking-wide text-[var(--app-muted)] uppercase">
                    Total focus
                  </span>
                  <p className="mt-1 text-base font-semibold font-mono text-[var(--app-text)]">
                    {formatMinutes(focus.totalMinutes ?? 0)}
                  </p>
                </div>
                <div className="rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel-hover)] p-3">
                  <span className="text-[11px] font-mono font-medium tracking-wide text-[var(--app-muted)] uppercase">
                    Sessions
                  </span>
                  <p className="mt-1 text-base font-semibold font-mono text-[var(--app-text)]">
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
                  className="flex items-center justify-between gap-3 rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel-hover)] p-3"
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
    <div className="flex flex-col gap-0.5 rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3.5 transition-colors">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-[4px]"
        style={{ backgroundColor: accentBackground, color: accent }}
      >
        {icon}
      </span>
      <span className="mt-1 text-xs font-medium text-[var(--app-muted)]">{label}</span>
      <span className="text-xl font-semibold text-[var(--app-text)] font-mono tabular-nums">
        {value}
      </span>
      <span className="text-[11px] text-[var(--app-muted)]">{hint}</span>
    </div>
  );
}
