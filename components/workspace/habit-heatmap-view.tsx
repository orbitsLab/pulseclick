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
    <div className="space-y-6">
      {/* Top Filter and Highlights */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--app-border)]/80 bg-[var(--app-panel)] p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[var(--app-accent-text)]" />
            <h3 className="app-heading font-semibold text-[var(--app-text)]">
              Annual Habit Consistency
            </h3>
          </div>
          <p className="app-body text-[var(--app-muted)] text-xs mt-1">
            Visualizing 365 days of routine completions and practice density.
          </p>
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--app-muted)]" />
          <select
            value={selectedHabitId}
            onChange={(e) => onSelectHabitId(e.target.value)}
            className="rounded-xl border border-[var(--app-border)] bg-[var(--app-panel-alt)] px-3 py-1.5 app-label text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)]"
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
        <div className="rounded-xl border border-[var(--app-border)]/70 bg-[var(--app-panel)] p-3.5">
          <span className="app-overline font-semibold text-[var(--app-muted)] text-[10px]">
            ACTIVE DAYS
          </span>
          <div className="app-figure text-2xl font-bold text-[var(--app-text)] mt-1">
            {activeDays}
            <span className="app-meta font-normal text-[var(--app-muted)] ml-1">/ 365</span>
          </div>
          <span className="app-meta text-emerald-500 font-medium mt-0.5 block">
            {Math.round((activeDays / 365) * 100)}% consistency
          </span>
        </div>

        <div className="rounded-xl border border-[var(--app-border)]/70 bg-[var(--app-panel)] p-3.5">
          <span className="app-overline font-semibold text-[var(--app-muted)] text-[10px]">
            TOTAL CHECK-INS
          </span>
          <div className="app-figure text-2xl font-bold text-[var(--app-text)] mt-1">
            {totalCheckIns}
          </div>
          <span className="app-meta text-[var(--app-muted)] mt-0.5 block">
            Across {selectedHabit ? "selected habit" : `${habits.length} habits`}
          </span>
        </div>

        <div className="rounded-xl border border-[var(--app-border)]/70 bg-[var(--app-panel)] p-3.5">
          <span className="app-overline font-semibold text-[var(--app-muted)] text-[10px]">
            LONGEST STREAK
          </span>
          <div className="app-figure text-2xl font-bold text-amber-500 mt-1 flex items-center gap-1">
            <Flame className="h-5 w-5 fill-current" />
            {analytics?.stats?.bestStreak || 0}
            <span className="app-meta font-normal text-[var(--app-muted)]">days</span>
          </div>
          <span className="app-meta text-[var(--app-muted)] mt-0.5 block">Personal best run</span>
        </div>

        <div className="rounded-xl border border-[var(--app-border)]/70 bg-[var(--app-panel)] p-3.5">
          <span className="app-overline font-semibold text-[var(--app-muted)] text-[10px]">
            PEAK DAY
          </span>
          <div className="app-figure text-2xl font-bold text-[var(--app-accent-text)] mt-1">
            {peakDay?.count || 0}
            <span className="app-meta font-normal text-[var(--app-muted)] ml-1">habits</span>
          </div>
          <span className="app-meta text-[var(--app-muted)] mt-0.5 block">
            {peakDay ? peakDay.date : "—"}
          </span>
        </div>
      </div>

      {/* Heatmap Matrix Surface */}
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-4 sm:p-6 overflow-hidden">
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
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-4 sm:p-5 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--app-border)]/60">
            <div>
              <span className="app-overline font-semibold text-[var(--app-muted)]">
                DAY DETAILS
              </span>
              <h4 className="app-title font-semibold text-[var(--app-text)]">
                {new Date(inspectedDay.date + "T12:00:00Z").toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h4>
            </div>

            <span className="rounded-full bg-[var(--app-accent)]/15 px-3 py-1 app-label font-bold text-[var(--app-accent-text)]">
              {inspectedDay.count} routines checked in
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {inspectedDay.habits.length === 0 ? (
              <p className="app-body text-[var(--app-muted)] text-sm py-4 text-center">
                No habit activity recorded on this day.
              </p>
            ) : (
              inspectedDay.habits.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[var(--app-border)]/50 bg-[var(--app-panel-alt)]/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold"
                      style={{ backgroundColor: item.color || "var(--app-accent)" }}
                    >
                      <Check className="h-4 w-4 stroke-[3]" />
                    </div>

                    <div>
                      <span className="app-label font-semibold text-[var(--app-text)]">
                        {item.title}
                      </span>
                      {item.value !== null && item.value !== undefined && (
                        <span className="app-meta text-[var(--app-accent-text)] font-semibold ml-2">
                          Logged: {item.value} {item.unit || ""}
                        </span>
                      )}
                      {item.note && (
                        <p className="app-meta italic text-[var(--app-muted)] flex items-center gap-1 mt-0.5">
                          <StickyNote className="h-3 w-3" />
                          <span>&ldquo;{item.note}&rdquo;</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`app-meta font-bold px-2 py-0.5 rounded-md ${
                      item.status === "SKIPPED"
                        ? "bg-amber-500/15 text-amber-500"
                        : "bg-emerald-500/15 text-emerald-500"
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
