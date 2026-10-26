"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Calendar,
  CheckCircle2,
  Flame,
  SkipForward,
  StickyNote,
  Clock,
  Filter,
  X,
  BookOpen,
  Dumbbell,
  Droplets,
  Heart,
  Smile,
  Target,
  Sparkles,
  Footprints,
  Sun,
  Moon,
  Activity,
} from "lucide-react";
import { Habit, HabitAnalyticsData } from "@/hooks/use-workspace";
import { getTodayISO, addDays } from "@/lib/date-utils";

interface HabitLogsViewProps {
  analytics: HabitAnalyticsData | null;
  habits: Habit[];
  isLoading?: boolean;
  onSelectHabit?: (habitId: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Flame: <Flame className="h-4 w-4" />,
  Dumbbell: <Dumbbell className="h-4 w-4" />,
  BookOpen: <BookOpen className="h-4 w-4" />,
  Droplets: <Droplets className="h-4 w-4" />,
  Heart: <Heart className="h-4 w-4" />,
  Smile: <Smile className="h-4 w-4" />,
  Target: <Target className="h-4 w-4" />,
  Sparkles: <Sparkles className="h-4 w-4" />,
  Footprints: <Footprints className="h-4 w-4" />,
  Sun: <Sun className="h-4 w-4" />,
  Moon: <Moon className="h-4 w-4" />,
  Activity: <Activity className="h-4 w-4" />,
};

export function HabitLogsView({
  analytics,
  habits,
  isLoading,
  onSelectHabit,
}: HabitLogsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHabitId, setSelectedHabitId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "SKIPPED" | "IN_PROGRESS">("ALL");

  const todayIso = getTodayISO();
  const yesterdayIso = addDays(todayIso, -1);

  const logs = analytics?.recentLogs || [];

  // Filter logs based on search, habit, and status
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Habit filter
      if (selectedHabitId !== "ALL" && log.habitId !== selectedHabitId) {
        return false;
      }

      // Status filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "COMPLETED" && log.status !== "COMPLETED" && !log.completed) return false;
        if (statusFilter === "SKIPPED" && log.status !== "SKIPPED") return false;
        if (statusFilter === "IN_PROGRESS" && log.status !== "IN_PROGRESS") return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = log.title?.toLowerCase().includes(q);
        const matchesNote = log.note?.toLowerCase().includes(q);
        const matchesDate = log.date.includes(q);
        if (!matchesTitle && !matchesNote && !matchesDate) return false;
      }

      return true;
    });
  }, [logs, selectedHabitId, statusFilter, searchQuery]);

  // Group filtered logs by date
  const groupedByDate = useMemo(() => {
    const groups: { date: string; label: string; logs: typeof logs }[] = [];
    const map = new Map<string, typeof logs>();

    filteredLogs.forEach((item) => {
      if (!map.has(item.date)) {
        map.set(item.date, []);
      }
      map.get(item.date)!.push(item);
    });

    // Sort descending by date
    const sortedDates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

    sortedDates.forEach((d) => {
      let label = d;
      try {
        const [year, month, day] = d.split("-").map(Number);
        const dt = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        const formatted = dt.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        if (d === todayIso) {
          label = `Today · ${formatted}`;
        } else if (d === yesterdayIso) {
          label = `Yesterday · ${formatted}`;
        } else {
          label = formatted;
        }
      } catch {
        label = d;
      }

      groups.push({
        date: d,
        label,
        logs: map.get(d)!,
      });
    });

    return groups;
  }, [filteredLogs, todayIso, yesterdayIso]);

  return (
    <div className="space-y-6">
      {/* 1. Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--app-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journal entries & reflection notes..."
            className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel-alt)] py-1.5 pl-9 pr-8 app-body text-[var(--app-text)] placeholder:text-[var(--app-muted)] focus:outline-hidden focus:border-[var(--app-accent)] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)] hover:text-[var(--app-text)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Habit Dropdown */}
          <select
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="rounded-xl border border-[var(--app-border)] bg-[var(--app-panel-alt)] px-3 py-1.5 app-label font-medium text-[var(--app-text)] focus:outline-hidden focus:border-[var(--app-accent)] transition-colors"
          >
            <option value="ALL">All Habits ({habits.length})</option>
            {habits.map((h) => (
              <option key={h.id} value={h.id}>
                {h.title}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-[var(--app-border)] bg-[var(--app-panel-alt)] px-3 py-1.5 app-label font-medium text-[var(--app-text)] focus:outline-hidden focus:border-[var(--app-accent)] transition-colors"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="SKIPPED">Skipped (Protected)</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>
        </div>
      </div>

      {/* 2. Feed Container */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-[var(--app-border)]/60 bg-[var(--app-panel-alt)]/40 animate-pulse"
            />
          ))}
        </div>
      ) : groupedByDate.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--app-muted)] rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--app-accent)]/10 text-[var(--app-accent-text)] mb-3">
            <StickyNote className="h-6 w-6" />
          </div>
          <h3 className="app-heading font-semibold text-[var(--app-text)]">No journal entries found</h3>
          <p className="app-label text-[var(--app-muted)] mt-1 max-w-sm">
            {searchQuery || selectedHabitId !== "ALL" || statusFilter !== "ALL"
              ? "No habit records match your active search filters. Try clearing or expanding your query."
              : "Check in on habits or log daily reflection notes to build your chronological practice log."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDate.map((group) => (
            <div key={group.date} className="space-y-3">
              {/* Date Header */}
              <div className="flex items-center gap-2 px-1">
                <Calendar className="h-3.5 w-3.5 text-[var(--app-accent-text)]" />
                <span className="app-label font-semibold text-[var(--app-text)]">
                  {group.label}
                </span>
                <span className="rounded-full bg-[var(--app-panel-alt)] px-2 py-0.5 app-meta font-medium text-[var(--app-muted)] border border-[var(--app-border)]/60">
                  {group.logs.length} {group.logs.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              {/* Items for this date */}
              <div className="space-y-2">
                {group.logs.map((log) => {
                  const isCompleted = log.completed || log.status === "COMPLETED";
                  const isSkipped = log.status === "SKIPPED";
                  const isInProgress = log.status === "IN_PROGRESS";

                  return (
                    <div
                      key={log.id}
                      className="group rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-3.5 sm:p-4 hover:border-[var(--app-border)]/80 transition-colors"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        {/* Habit Title & Icon */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
                            style={{ backgroundColor: log.color || "var(--app-accent)" }}
                          >
                            {ICON_MAP[log.icon] || <Flame className="h-4 w-4" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="app-body font-semibold text-[var(--app-text)]">
                                {log.title}
                              </span>

                              {/* Status Badge */}
                              {isCompleted && (
                                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 app-meta font-bold text-emerald-500">
                                  <CheckCircle2 className="h-3 w-3 stroke-[2.2]" />
                                  Completed
                                </span>
                              )}
                              {isSkipped && (
                                <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 app-meta font-bold text-amber-500">
                                  <SkipForward className="h-3 w-3" />
                                  Skipped (Protected)
                                </span>
                              )}
                              {isInProgress && (
                                <span className="flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 app-meta font-bold text-sky-500">
                                  In Progress
                                </span>
                              )}

                              {/* Logged value */}
                              {log.value !== null && log.value !== undefined && (
                                <span className="rounded-full bg-[var(--app-panel-alt)] px-2 py-0.5 app-meta font-bold text-[var(--app-text)] border border-[var(--app-border)]/80">
                                  {log.value} {log.unit || ""}
                                </span>
                              )}
                            </div>

                            {/* Reflection Memo Note */}
                            {log.note && (
                              <div className="mt-2.5 rounded-xl border border-[var(--app-border)]/60 bg-[var(--app-panel-alt)]/50 p-2.5 flex items-start gap-2">
                                <StickyNote className="h-3.5 w-3.5 text-[var(--app-muted)] shrink-0 mt-0.5" />
                                <p className="app-body text-xs text-[var(--app-text)]/90 leading-relaxed italic">
                                  &ldquo;{log.note}&rdquo;
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Date / Time */}
                        <div className="flex items-center gap-1.5 app-meta text-[var(--app-muted)]">
                          <Clock className="h-3 w-3" />
                          <span>{log.date}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
