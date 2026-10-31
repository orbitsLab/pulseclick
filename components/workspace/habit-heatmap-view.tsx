"use client";

import React, { useState, useMemo } from "react";
import {
  CalendarDays,
  Flame,
  Check,
  Sparkles,
  Info,
  ChevronRight,
  Filter,
  StickyNote,
} from "lucide-react";
import { Habit, HabitAnalyticsData, HeatmapDay } from "@/hooks/use-workspace";

interface HabitHeatmapViewProps {
  analytics: HabitAnalyticsData | null;
  habits: Habit[];
  selectedHabitId: string;
  onSelectHabitId: (id: string) => void;
  isLoading?: boolean;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

export function HabitHeatmapView({
  analytics,
  habits,
  selectedHabitId,
  onSelectHabitId,
  isLoading,
}: HabitHeatmapViewProps) {
  const [activeHoverDay, setActiveHoverDay] = useState<HeatmapDay | null>(null);

  const heatmapData = analytics?.heatmap || [];
  const selectedHabit = habits.find((h) => h.id === selectedHabitId);
  const themeColor = selectedHabit ? selectedHabit.color : "var(--app-accent)";

  // Organize the 365 days into 53 weeks (columns) x 7 days (rows, 0=Mon .. 6=Sun)
  const { weeks, monthLabels, totalCheckIns, activeDays, peakDay } = useMemo(() => {
    if (heatmapData.length === 0) {
      return { weeks: [], monthLabels: [], totalCheckIns: 0, activeDays: 0, peakDay: null as HeatmapDay | null };
    }

    let checkInsSum = 0;
    let daysWithCheckIn = 0;
    let maxDay: HeatmapDay | null = null;

    heatmapData.forEach((day) => {
      checkInsSum += day.count;
      if (day.count > 0) daysWithCheckIn++;
      if (!maxDay || day.count > maxDay.count) {
        maxDay = day;
      }
    });

    // Determine day of week for the first day (0 = Mon, ..., 6 = Sun)
    const firstDate = new Date(heatmapData[0].date + "T12:00:00Z");
    const rawDay = firstDate.getUTCDay(); // 0 is Sun
    const startOffset = rawDay === 0 ? 6 : rawDay - 1; // 0 is Mon

    const matrix: (HeatmapDay | null)[][] = [];
    let currentWeek: (HeatmapDay | null)[] = Array(startOffset).fill(null);

    heatmapData.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        matrix.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      matrix.push(currentWeek);
    }

    // Compute month label positions based on first occurrence of each month
    const months: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    matrix.forEach((week, wIdx) => {
      const validDay = week.find((d) => d !== null);
      if (validDay) {
        const m = Number(validDay.date.split("-")[1]) - 1;
        if (m !== lastMonth) {
          months.push({ label: MONTH_NAMES[m], weekIndex: wIdx });
          lastMonth = m;
        }
      }
    });

    return {
      weeks: matrix,
      monthLabels: months,
      totalCheckIns: checkInsSum,
      activeDays: daysWithCheckIn,
      peakDay: maxDay,
    };
  }, [heatmapData]);

  // Default inspector to today or last logged day
  const inspectedDay = activeHoverDay || (heatmapData.length > 0 ? heatmapData[heatmapData.length - 1] : null);

  const getIntensityStyle = (intensity: number) => {
    if (intensity === 0) {
      return { backgroundColor: "var(--app-panel-alt)", opacity: 0.5 };
    }
    const opacities = [0.15, 0.35, 0.65, 0.95];
    return {
      backgroundColor: themeColor,
      opacity: opacities[Math.min(3, intensity - 1)],
    };
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Highlights */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3.5 sm:p-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[var(--app-accent)]" />
            <h3 className="text-sm font-semibold text-[var(--app-text)]">
              Annual Habit Consistency
            </h3>
          </div>
          <p className="text-xs text-[var(--app-muted)] mt-0.5">
            Visualizing 365 days of routine completions and practice density.
          </p>
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[var(--app-muted)]" />
          <select
            value={selectedHabitId}
            onChange={(e) => onSelectHabitId(e.target.value)}
            className="rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] cursor-pointer"
          >
            <option value="all">All Habits (Combined)</option>
            {habits.map((h) => (
              <option key={h.id} value={h.id}>
                {h.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3">
          <span className="text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider">
            ACTIVE DAYS
          </span>
          <div className="text-xl font-semibold text-[var(--app-text)] font-mono tabular-nums mt-1">
            {activeDays}
            <span className="text-xs font-normal text-[var(--app-muted)] ml-1">/ 365</span>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 block">
            {Math.round((activeDays / 365) * 100)}% consistency
          </span>
        </div>

        <div className="rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3">
          <span className="text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider">
            TOTAL CHECK-INS
          </span>
          <div className="text-xl font-semibold text-[var(--app-text)] font-mono tabular-nums mt-1">
            {totalCheckIns}
          </div>
          <span className="text-xs text-[var(--app-muted)] mt-0.5 block">
            Across {selectedHabit ? "selected habit" : `${habits.length} habits`}
          </span>
        </div>

        <div className="rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3">
          <span className="text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider">
            LONGEST STREAK
          </span>
          <div className="text-xl font-semibold text-amber-500 font-mono tabular-nums mt-1 flex items-center gap-1">
            <Flame className="h-4 w-4 fill-current" />
            {analytics?.stats?.bestStreak || 0}
            <span className="text-xs font-normal text-[var(--app-muted)]">days</span>
          </div>
          <span className="text-xs text-[var(--app-muted)] mt-0.5 block">Personal best run</span>
        </div>

        <div className="rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3">
          <span className="text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider">
            PEAK DAY
          </span>
          <div className="text-xl font-semibold text-[var(--app-accent)] font-mono tabular-nums mt-1">
            {peakDay?.count || 0}
            <span className="text-xs font-normal text-[var(--app-muted)] ml-1">habits</span>
          </div>
          <span className="text-xs text-[var(--app-muted)] mt-0.5 block">
            {peakDay ? peakDay.date : "—"}
          </span>
        </div>
      </div>

      {/* Heatmap Matrix Surface */}
      <div className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-4 sm:p-5 overflow-hidden">
        {/* Month Labels Bar */}
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[760px]">
            {/* Header Months */}
            <div className="flex text-[11px] font-semibold text-[var(--app-muted)] mb-2 pl-8">
              {monthLabels.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "relative",
                    left: `${m.weekIndex * 14}px`,
                    width: 0,
                  }}
                  className="whitespace-nowrap"
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* Matrix Body: Weekday Labels + 53 Columns of 7 Rows */}
            <div className="flex gap-2">
              {/* Weekday indicators (Mon, Wed, Fri, Sun) */}
              <div className="flex flex-col justify-between py-0.5 text-[10px] font-semibold text-[var(--app-muted)] w-6 shrink-0">
                {WEEKDAY_LABELS.map((w, i) => (
                  <span key={i} className="h-3 leading-3">
                    {w}
                  </span>
                ))}
              </div>

              {/* Grid of Weeks */}
              <div className="flex gap-1.5 flex-1">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1.5">
                    {week.map((day, dIdx) => {
                      if (!day) {
                        return <div key={dIdx} className="h-3 w-3 rounded-xs opacity-0" />;
                      }

                      const isSelected = inspectedDay?.date === day.date;

                      return (
                        <button
                          key={day.date}
                          type="button"
                          onClick={() => setActiveHoverDay(day)}
                          onMouseEnter={() => setActiveHoverDay(day)}
                          className={`h-3 w-3 rounded-xs transition-all hover:scale-130 hover:z-10 cursor-pointer ${
                            isSelected ? "ring-2 ring-[var(--app-accent)] ring-offset-1 ring-offset-[var(--app-panel)] scale-120 z-10" : ""
                          }`}
                          style={getIntensityStyle(day.intensity)}
                          title={`${day.date}: ${day.count} check-ins`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--app-border)]/60 text-xs text-[var(--app-muted)]">
              <span className="app-meta text-[var(--app-muted)]">
                Yearly consistency overview (365 days)
              </span>

              <div className="flex items-center gap-2 app-meta font-medium">
                <span>Less</span>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-xs" style={getIntensityStyle(0)} />
                  <div className="h-3 w-3 rounded-xs" style={getIntensityStyle(1)} />
                  <div className="h-3 w-3 rounded-xs" style={getIntensityStyle(2)} />
                  <div className="h-3 w-3 rounded-xs" style={getIntensityStyle(3)} />
                  <div className="h-3 w-3 rounded-xs" style={getIntensityStyle(4)} />
                </div>
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Inspector Card */}
      {inspectedDay && (
        <div className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-4 sm:p-5 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--app-border)]">
            <div>
              <span className="text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider">
                DAY DETAILS
              </span>
              <h4 className="text-sm font-semibold text-[var(--app-text)]">
                {new Date(inspectedDay.date + "T12:00:00Z").toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h4>
            </div>

            <span className="rounded-[3px] bg-[rgba(35,131,226,0.12)] text-[#2383e2] dark:text-[#529cca] border border-[rgba(35,131,226,0.25)] px-2.5 py-0.5 text-xs font-medium">
              {inspectedDay.count} routines checked in
            </span>
          </div>

          <div className="mt-3.5 space-y-2">
            {inspectedDay.habits.length === 0 ? (
              <p className="text-xs text-[var(--app-muted)] py-4 text-center">
                No habit activity recorded on this day.
              </p>
            ) : (
              inspectedDay.habits.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-[6px] border border-[var(--app-border)] bg-[var(--app-hover)]/30 p-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-[4px] text-white font-medium"
                      style={{ backgroundColor: item.color || "var(--app-accent)" }}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-[var(--app-text)]">
                        {item.title}
                      </span>
                      {item.value !== null && item.value !== undefined && (
                        <span className="text-xs text-[var(--app-accent)] font-mono ml-2">
                          Logged: {item.value} {item.unit || ""}
                        </span>
                      )}
                      {item.note && (
                        <p className="text-[11px] italic text-[var(--app-muted)] flex items-center gap-1 mt-0.5">
                          <StickyNote className="h-3 w-3" />
                          <span>&ldquo;{item.note}&rdquo;</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-[3px] border ${
                      item.status === "SKIPPED"
                        ? "bg-[rgba(203,145,47,0.1)] text-[#dfab01] dark:text-[#f3cd46] border-[rgba(203,145,47,0.25)]"
                        : "bg-[rgba(68,131,97,0.1)] text-[#448361] dark:text-[#4dab9a] border-[rgba(68,131,97,0.25)]"
                    }`}
                  >
                    {item.status === "SKIPPED" ? "Skipped" : "Completed"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
