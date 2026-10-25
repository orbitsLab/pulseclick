"use client";

import React from "react";
import {
  Activity,
  Trophy,
  Flame,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Calendar,
  Sparkles,
} from "lucide-react";
import { HabitAnalyticsData } from "@/hooks/use-ticktick";

interface HabitStatsViewProps {
  analytics: HabitAnalyticsData | null;
  isLoading?: boolean;
}

export function HabitStatsView({ analytics, isLoading }: HabitStatsViewProps) {
  const stats = analytics?.stats;
  const perHabitStats = stats?.perHabitStats || [];
  const dayOfWeekDistribution = stats?.dayOfWeekDistribution || [];
  const monthlyTrends = stats?.monthlyTrends || [];

  // Find peak day of week
  const peakWeekday = [...dayOfWeekDistribution].sort((a, b) => b.count - a.count)[0];
  const maxDayCount = Math.max(1, ...dayOfWeekDistribution.map((d) => d.count));
  const maxMonthCount = Math.max(1, ...monthlyTrends.map((m) => m.count));

  return (
    <div className="space-y-6">
      {/* 1. Header Overview KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel)] p-4">
          <span className="tt-overline font-semibold text-[var(--tt-muted)] text-[10px]">
            ALL-TIME CHECK-INS
          </span>
          <div className="tt-figure text-3xl font-bold text-[var(--tt-text)] mt-1">
            {stats?.totalCheckIns || 0}
          </div>
          <span className="tt-meta text-emerald-500 font-medium mt-1 block">
            Practiced consistently
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel)] p-4">
          <span className="tt-overline font-semibold text-[var(--tt-muted)] text-[10px]">
            COMPLETED CYCLES
          </span>
          <div className="tt-figure text-3xl font-bold text-[var(--tt-accent-text)] mt-1 flex items-center gap-1.5">
            <Trophy className="h-6 w-6 stroke-[2.2]" />
            {stats?.totalCycles || 0}
          </div>
          <span className="tt-meta text-[var(--tt-muted)] mt-1 block">
            Target intervals achieved
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel)] p-4">
          <span className="tt-overline font-semibold text-[var(--tt-muted)] text-[10px]">
            PEAK STREAK
          </span>
          <div className="tt-figure text-3xl font-bold text-amber-500 mt-1 flex items-center gap-1">
            <Flame className="h-6 w-6 fill-current" />
            {stats?.bestStreak || 0}
            <span className="tt-meta font-normal text-[var(--tt-muted)] ml-1">days</span>
          </div>
          <span className="tt-meta text-[var(--tt-muted)] mt-1 block">
            Active: {stats?.currentStreak || 0} days
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel)] p-4">
          <span className="tt-overline font-semibold text-[var(--tt-muted)] text-[10px]">
            CONSISTENT DAY
          </span>
          <div className="tt-figure text-2xl font-bold text-[var(--tt-text)] mt-1">
            {peakWeekday ? peakWeekday.name : "—"}
          </div>
          <span className="tt-meta text-sky-400 font-medium mt-1 block">
            {peakWeekday?.count || 0} total check-ins
          </span>
        </div>
      </div>

      {/* 2. Charts Row: Weekly Rhythm & Monthly Trend */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Weekly Rhythm */}
        <div className="rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel)] p-5">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--tt-border)]/60">
            <div>
              <h4 className="tt-title font-semibold text-[var(--tt-text)]">
                Weekly Rhythm
              </h4>
              <p className="tt-meta text-[var(--tt-muted)]">
                Check-in distribution across days of the week.
              </p>
            </div>
            <span className="rounded-md bg-[var(--tt-panel-alt)] px-2 py-1 tt-meta font-bold text-[var(--tt-accent-text)]">
              Mon — Sun
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {dayOfWeekDistribution.map((day) => {
              const pct = Math.round((day.count / maxDayCount) * 100);
              const isPeak = day.name === peakWeekday?.name;

              return (
                <div key={day.name} className="flex items-center gap-3">
                  <span className={`w-8 tt-label font-bold text-xs ${isPeak ? "text-[var(--tt-accent-text)]" : "text-[var(--tt-muted)]"}`}>
                    {day.name}
                  </span>

                  <div className="flex-1 h-3 rounded-full bg-[var(--tt-panel-alt)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPeak
                          ? "bg-gradient-to-r from-[var(--tt-accent)] to-sky-400"
                          : "bg-[var(--tt-accent)]/60"
                      }`}
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>

                  <span className="w-8 text-right tt-meta font-bold text-[var(--tt-text)] text-xs">
                    {day.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel)] p-5">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--tt-border)]/60">
            <div>
              <h4 className="tt-title font-semibold text-[var(--tt-text)]">
                Monthly Consistency
              </h4>
              <p className="tt-meta text-[var(--tt-muted)]">
                Habit completion trend over the last 6 months.
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>

          <div className="flex items-end justify-between gap-2 h-44 pt-4 px-2">
            {monthlyTrends.map((m) => {
              const heightPct = Math.round((m.count / maxMonthCount) * 100);

              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="tt-meta font-bold text-[var(--tt-text)] text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {m.count}
                  </span>
                  <div className="w-full max-w-[36px] bg-[var(--tt-panel-alt)] rounded-t-lg h-full flex items-end overflow-hidden">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[var(--tt-accent)] to-sky-400 transition-all duration-500"
                      style={{ height: `${Math.max(8, heightPct)}%` }}
                    />
                  </div>
                  <span className="tt-overline font-semibold text-[var(--tt-muted)] text-[10px]">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Detailed Per-Habit Performance Table */}
      <div className="rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel)] p-5 overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--tt-border)]/60">
          <div>
            <h4 className="tt-title font-semibold text-[var(--tt-text)]">
              Habit Performance Breakdown
            </h4>
            <p className="tt-meta text-[var(--tt-muted)]">
              Streaks, cycles, and completion rates by habit.
            </p>
          </div>
          <span className="tt-meta font-bold text-[var(--tt-muted)]">
            {perHabitStats.length} habits
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--tt-border)]/60 text-[11px] font-semibold text-[var(--tt-muted)] uppercase tracking-wider">
                <th className="pb-3 pl-1">Habit</th>
                <th className="pb-3">Current Streak</th>
                <th className="pb-3">Best Run</th>
                <th className="pb-3">Cycles</th>
                <th className="pb-3">Total Logs</th>
                <th className="pb-3 pr-1 text-right">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--tt-border)]/40 text-sm">
              {perHabitStats.map((habit) => (
                <tr key={habit.id} className="hover:bg-[var(--tt-panel-alt)]/40 transition-colors">
                  <td className="py-3.5 pl-1">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: habit.color || "var(--tt-accent)" }}
                      />
                      <div>
                        <span className="tt-label font-semibold text-[var(--tt-text)] block">
                          {habit.title}
                        </span>
                        <span className="tt-meta text-[var(--tt-muted)]">
                          {habit.frequency === "DAILY" ? "Daily" : `${habit.targetDays}x/wk`}
                          {habit.goalType === "NUMERIC" && ` · Target ${habit.goalValue} ${habit.goalUnit || ""}`}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5">
                    <span className="flex items-center gap-1 tt-label font-bold text-amber-500">
                      <Flame className="h-3.5 w-3.5 fill-current" />
                      {habit.streak}d
                    </span>
                  </td>

                  <td className="py-3.5">
                    <span className="tt-label font-medium text-[var(--tt-text)]">
                      {habit.bestStreak} days
                    </span>
                  </td>

                  <td className="py-3.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--tt-panel-alt)] px-2 py-0.5 tt-meta font-bold text-[var(--tt-accent-text)] border border-[var(--tt-border)]/50">
                      <Trophy className="h-3 w-3" />
                      {habit.completedCycles}
                    </span>
                  </td>

                  <td className="py-3.5 tt-label font-medium text-[var(--tt-text)]">
                    {habit.totalLogs}
                  </td>

                  <td className="py-3.5 pr-1 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <div className="w-20 h-2 rounded-full bg-[var(--tt-panel-alt)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${habit.completionRate}%`,
                            backgroundColor: habit.color || "var(--tt-accent)",
                          }}
                        />
                      </div>
                      <span className="tt-meta font-bold text-[var(--tt-text)] w-8 text-right">
                        {habit.completionRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
