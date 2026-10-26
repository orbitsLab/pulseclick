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
import { HabitAnalyticsData } from "@/hooks/use-workspace";

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
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-4">
          <span className="app-overline font-semibold text-[var(--app-muted)] text-[10px]">
            ALL-TIME CHECK-INS
          </span>
          <div className="app-figure text-3xl font-bold text-[var(--app-text)] mt-1">
            {stats?.totalCheckIns || 0}
          </div>
          <span className="app-meta text-emerald-500 font-medium mt-1 block">
            Practiced consistently
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-4">
          <span className="app-overline font-semibold text-[var(--app-muted)] text-[10px]">
            COMPLETED CYCLES
          </span>
          <div className="app-figure text-3xl font-bold text-[var(--app-accent-text)] mt-1 flex items-center gap-1.5">
            <Trophy className="h-6 w-6 stroke-[2.2]" />
            {stats?.totalCycles || 0}
          </div>
          <span className="app-meta text-[var(--app-muted)] mt-1 block">
            Target intervals achieved
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-4">
          <span className="app-overline font-semibold text-[var(--app-muted)] text-[10px]">
            PEAK STREAK
          </span>
          <div className="app-figure text-3xl font-bold text-amber-500 mt-1 flex items-center gap-1">
            <Flame className="h-6 w-6 fill-current" />
            {stats?.bestStreak || 0}
            <span className="app-meta font-normal text-[var(--app-muted)] ml-1">days</span>
          </div>
          <span className="app-meta text-[var(--app-muted)] mt-1 block">
            Active: {stats?.currentStreak || 0} days
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-4">
          <span className="app-overline font-semibold text-[var(--app-muted)] text-[10px]">
            CONSISTENT DAY
          </span>
          <div className="app-figure text-2xl font-bold text-[var(--app-text)] mt-1">
            {peakWeekday ? peakWeekday.name : "—"}
          </div>
          <span className="app-meta text-sky-400 font-medium mt-1 block">
            {peakWeekday?.count || 0} total check-ins
          </span>
        </div>
      </div>

      {/* 2. Charts Row: Weekly Rhythm & Monthly Trend */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Weekly Rhythm */}
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--app-border)]/60">
            <div>
              <h4 className="app-title font-semibold text-[var(--app-text)]">
                Weekly Rhythm
              </h4>
              <p className="app-meta text-[var(--app-muted)]">
                Check-in distribution across days of the week.
              </p>
            </div>
            <span className="rounded-md bg-[var(--app-panel-alt)] px-2 py-1 app-meta font-bold text-[var(--app-accent-text)]">
              Mon — Sun
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {dayOfWeekDistribution.map((day) => {
              const pct = Math.round((day.count / maxDayCount) * 100);
              const isPeak = day.name === peakWeekday?.name;

              return (
                <div key={day.name} className="flex items-center gap-3">
                  <span className={`w-8 app-label font-bold text-xs ${isPeak ? "text-[var(--app-accent-text)]" : "text-[var(--app-muted)]"}`}>
                    {day.name}
                  </span>

                  <div className="flex-1 h-3 rounded-full bg-[var(--app-panel-alt)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPeak
                          ? "bg-gradient-to-r from-[var(--app-accent)] to-sky-400"
                          : "bg-[var(--app-accent)]/60"
                      }`}
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>

                  <span className="w-8 text-right app-meta font-bold text-[var(--app-text)] text-xs">
                    {day.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--app-border)]/60">
            <div>
              <h4 className="app-title font-semibold text-[var(--app-text)]">
                Monthly Consistency
              </h4>
              <p className="app-meta text-[var(--app-muted)]">
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
                  <span className="app-meta font-bold text-[var(--app-text)] text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {m.count}
                  </span>
                  <div className="w-full max-w-[36px] bg-[var(--app-panel-alt)] rounded-t-lg h-full flex items-end overflow-hidden">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[var(--app-accent)] to-sky-400 transition-all duration-500"
                      style={{ height: `${Math.max(8, heightPct)}%` }}
                    />
                  </div>
                  <span className="app-overline font-semibold text-[var(--app-muted)] text-[10px]">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Detailed Per-Habit Performance Table */}
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--app-border)]/60">
          <div>
            <h4 className="app-title font-semibold text-[var(--app-text)]">
              Habit Performance Breakdown
            </h4>
            <p className="app-meta text-[var(--app-muted)]">
              Streaks, cycles, and completion rates by habit.
            </p>
          </div>
          <span className="app-meta font-bold text-[var(--app-muted)]">
            {perHabitStats.length} habits
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--app-border)]/60 text-[11px] font-semibold text-[var(--app-muted)] uppercase tracking-wider">
                <th className="pb-3 pl-1">Habit</th>
                <th className="pb-3">Current Streak</th>
                <th className="pb-3">Best Run</th>
                <th className="pb-3">Cycles</th>
                <th className="pb-3">Total Logs</th>
                <th className="pb-3 pr-1 text-right">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border)]/40 text-sm">
              {perHabitStats.map((habit) => (
                <tr key={habit.id} className="hover:bg-[var(--app-panel-alt)]/40 transition-colors">
                  <td className="py-3.5 pl-1">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: habit.color || "var(--app-accent)" }}
                      />
                      <div>
                        <span className="app-label font-semibold text-[var(--app-text)] block">
                          {habit.title}
                        </span>
                        <span className="app-meta text-[var(--app-muted)]">
                          {habit.frequency === "DAILY" ? "Daily" : `${habit.targetDays}x/wk`}
                          {habit.goalType === "NUMERIC" && ` · Target ${habit.goalValue} ${habit.goalUnit || ""}`}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5">
                    <span className="flex items-center gap-1 app-label font-bold text-amber-500">
                      <Flame className="h-3.5 w-3.5 fill-current" />
                      {habit.streak}d
                    </span>
                  </td>

                  <td className="py-3.5">
                    <span className="app-label font-medium text-[var(--app-text)]">
                      {habit.bestStreak} days
                    </span>
                  </td>

                  <td className="py-3.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--app-panel-alt)] px-2 py-0.5 app-meta font-bold text-[var(--app-accent-text)] border border-[var(--app-border)]/50">
                      <Trophy className="h-3 w-3" />
                      {habit.completedCycles}
                    </span>
                  </td>

                  <td className="py-3.5 app-label font-medium text-[var(--app-text)]">
                    {habit.totalLogs}
                  </td>

                  <td className="py-3.5 pr-1 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <div className="w-20 h-2 rounded-full bg-[var(--app-panel-alt)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${habit.completionRate}%`,
                            backgroundColor: habit.color || "var(--app-accent)",
                          }}
                        />
                      </div>
                      <span className="app-meta font-bold text-[var(--app-text)] w-8 text-right">
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
