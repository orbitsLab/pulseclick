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
    <div className="space-y-4">
      {/* 1. Header Overview KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3.5">
          <span className="text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider">
            ALL-TIME CHECK-INS
          </span>
          <div className="text-2xl font-semibold text-[var(--app-text)] font-mono tabular-nums mt-1">
            {stats?.totalCheckIns || 0}
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 block">
            Practiced consistently
          </span>
        </div>

        <div className="rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3.5">
          <span className="text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider">
            COMPLETED CYCLES
          </span>
          <div className="text-2xl font-semibold text-[var(--app-accent)] font-mono tabular-nums mt-1 flex items-center gap-1.5">
            <Trophy className="h-5 w-5 stroke-[2]" />
            {stats?.totalCycles || 0}
          </div>
          <span className="text-xs text-[var(--app-muted)] mt-0.5 block">
            Target intervals achieved
          </span>
        </div>

        <div className="rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3.5">
          <span className="text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider">
            PEAK STREAK
          </span>
          <div className="text-2xl font-semibold text-amber-500 font-mono tabular-nums mt-1 flex items-center gap-1">
            <Flame className="h-5 w-5 fill-current" />
            {stats?.bestStreak || 0}
            <span className="text-xs font-normal text-[var(--app-muted)] ml-1">days</span>
          </div>
          <span className="text-xs text-[var(--app-muted)] mt-0.5 block">
            Active: {stats?.currentStreak || 0} days
          </span>
        </div>

        <div className="rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3.5">
          <span className="text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider">
            CONSISTENT DAY
          </span>
          <div className="text-2xl font-semibold text-[var(--app-text)] font-mono tabular-nums mt-1">
            {peakWeekday ? peakWeekday.name : "—"}
          </div>
          <span className="text-xs text-[#2383e2] dark:text-[#529cca] font-medium mt-0.5 block">
            {peakWeekday?.count || 0} total check-ins
          </span>
        </div>
      </div>

      {/* 2. Charts Row: Weekly Rhythm & Monthly Trend */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Weekly Rhythm */}
        <div className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--app-border)]">
            <div>
              <h4 className="text-sm font-semibold text-[var(--app-text)]">
                Weekly Rhythm
              </h4>
              <p className="text-xs text-[var(--app-muted)]">
                Check-in distribution across days of the week.
              </p>
            </div>
            <span className="rounded-[3px] bg-[var(--app-hover)] px-2 py-0.5 text-xs font-medium text-[var(--app-muted)]">
              Mon — Sun
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {dayOfWeekDistribution.map((day) => {
              const pct = Math.round((day.count / maxDayCount) * 100);
              const isPeak = day.name === peakWeekday?.name;

              return (
                <div key={day.name} className="flex items-center gap-3">
                  <span className={`w-8 text-xs font-medium ${isPeak ? "text-[var(--app-accent)] font-semibold" : "text-[var(--app-muted)]"}`}>
                    {day.name}
                  </span>

                  <div className="flex-1 h-2.5 rounded-[2px] bg-[var(--app-hover)] overflow-hidden">
                    <div
                      className={`h-full rounded-[2px] transition-all duration-300 ${
                        isPeak
                          ? "bg-[var(--app-accent)]"
                          : "bg-[var(--app-accent)]/60"
                      }`}
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>

                  <span className="w-8 text-right font-mono text-xs text-[var(--app-text)]">
                    {day.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--app-border)]">
            <div>
              <h4 className="text-sm font-semibold text-[var(--app-text)]">
                Monthly Consistency
              </h4>
              <p className="text-xs text-[var(--app-muted)]">
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
                  <span className="font-mono text-xs text-[var(--app-text)] opacity-0 group-hover:opacity-100 transition-opacity">
                    {m.count}
                  </span>
                  <div className="w-full max-w-[32px] bg-[var(--app-hover)] rounded-t-[3px] h-full flex items-end overflow-hidden">
                    <div
                      className="w-full rounded-t-[3px] bg-[var(--app-accent)] transition-all duration-300"
                      style={{ height: `${Math.max(8, heightPct)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Detailed Per-Habit Performance Table */}
      <div className="rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-4 overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--app-border)]">
          <div>
            <h4 className="text-sm font-semibold text-[var(--app-text)]">
              Habit Performance Breakdown
            </h4>
            <p className="text-xs text-[var(--app-muted)]">
              Streaks, cycles, and completion rates by habit.
            </p>
          </div>
          <span className="text-xs text-[var(--app-muted)]">
            {perHabitStats.length} habits
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--app-border)] text-[11px] font-semibold text-[var(--app-muted)] uppercase tracking-wider">
                <th className="pb-2.5 pl-1">Habit</th>
                <th className="pb-2.5">Current Streak</th>
                <th className="pb-2.5">Best Run</th>
                <th className="pb-2.5">Cycles</th>
                <th className="pb-2.5">Total Logs</th>
                <th className="pb-2.5 pr-1 text-right">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border)] text-xs">
              {perHabitStats.map((habit) => (
                <tr key={habit.id} className="hover:bg-[var(--app-hover)]/30 transition-colors">
                  <td className="py-2.5 pl-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: habit.color || "var(--app-accent)" }}
                      />
                      <div>
                        <span className="text-xs font-semibold text-[var(--app-text)] block">
                          {habit.title}
                        </span>
                        <span className="text-[11px] text-[var(--app-muted)]">
                          {habit.frequency === "DAILY" ? "Daily" : `${habit.targetDays}x/wk`}
                          {habit.goalType === "NUMERIC" && ` · Target ${habit.goalValue} ${habit.goalUnit || ""}`}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5">
                    <span className="flex items-center gap-1 font-mono text-amber-500 font-semibold">
                      <Flame className="h-3 w-3 fill-current" />
                      {habit.streak}d
                    </span>
                  </td>

                  <td className="py-2.5">
                    <span className="font-mono text-[var(--app-text)]">
                      {habit.bestStreak} days
                    </span>
                  </td>

                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1 rounded-[3px] bg-[var(--app-hover)] px-1.5 py-0.5 text-xs text-[var(--app-text)] border border-[var(--app-border)]">
                      <Trophy className="h-3 w-3" />
                      {habit.completedCycles}
                    </span>
                  </td>

                  <td className="py-2.5 font-mono text-[var(--app-text)]">
                    {habit.totalLogs}
                  </td>

                  <td className="py-2.5 pr-1 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-[var(--app-hover)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${habit.completionRate}%`,
                            backgroundColor: habit.color || "var(--app-accent)",
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs text-[var(--app-text)] w-8 text-right">
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
