"use client";

import React from "react";
import {
  Trophy,
  Award,
  Sparkles,
  Flame,
  Target,
  Footprints,
  Activity,
  Sun,
  BookOpen,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { HabitAnalyticsData } from "@/hooks/use-ticktick";

interface HabitAchievementsViewProps {
  analytics: HabitAnalyticsData | null;
  isLoading?: boolean;
}

const BADGE_ICONS: Record<string, React.ReactNode> = {
  Footprints: <Footprints className="h-5 w-5" />,
  Flame: <Flame className="h-5 w-5" />,
  Target: <Target className="h-5 w-5" />,
  Trophy: <Trophy className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
  Activity: <Activity className="h-5 w-5" />,
  Sun: <Sun className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
};

export function HabitAchievementsView({
  analytics,
  isLoading,
}: HabitAchievementsViewProps) {
  const achievements = analytics?.achievements;
  const level = achievements?.level || {
    level: 1,
    title: "Novice Practitioner",
    minScore: 0,
    nextScore: 200,
    progressPct: 0,
  };
  const score = achievements?.score || 0;
  const badges = achievements?.badges || [];
  const unlockedBadges = badges.filter((b) => b.unlocked);

  return (
    <div className="space-y-6">
      {/* 1. Level & Score Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--tt-border)] bg-gradient-to-br from-[var(--tt-panel)] via-[var(--tt-panel)] to-[var(--tt-panel-alt)] p-6 shadow-sm">
        {/* Glow orb */}
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[var(--tt-accent)] opacity-15 blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--tt-accent)] to-sky-500 text-white shadow-lg shadow-[var(--tt-accent)]/25">
              <Award className="h-8 w-8 stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--tt-accent)]/20 text-[var(--tt-accent-text)] px-2.5 py-0.5 tt-meta font-bold">
                  LEVEL {level.level}
                </span>
                <span className="tt-meta text-[var(--tt-muted)]">
                  {unlockedBadges.length} of {badges.length} Medals Unlocked
                </span>
              </div>

              <h3 className="tt-display text-2xl font-serif text-[var(--tt-text)] mt-1">
                {level.title}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="tt-overline font-semibold text-[var(--tt-muted)] text-[10px]">
              ACHIEVEMENT SCORE
            </span>
            <div className="tt-figure text-3xl font-bold text-[var(--tt-accent-text)]">
              {score}
              <span className="tt-meta font-normal text-[var(--tt-muted)] ml-1">pts</span>
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="mt-6 pt-4 border-t border-[var(--tt-border)]/60 space-y-2 relative z-10">
          <div className="flex justify-between tt-meta font-semibold text-[var(--tt-muted)]">
            <span>Next Level: {level.nextScore} pts</span>
            <span>{level.progressPct}% to Level {level.level + 1}</span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--tt-panel-alt)] border border-[var(--tt-border)]/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--tt-accent)] via-sky-400 to-indigo-500 transition-all duration-700"
              style={{ width: `${level.progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Scoring System Card */}
      <div className="rounded-2xl border border-[var(--tt-border)]/80 bg-[var(--tt-panel)] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--tt-accent-text)]" />
          <span className="tt-label font-bold text-[var(--tt-text)]">
            How Points Are Earned:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 tt-meta font-medium text-[var(--tt-muted)]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Check-in: <strong className="text-[var(--tt-text)]">+10 pts</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-[var(--tt-accent-text)]" />
            Target Cycle: <strong className="text-[var(--tt-text)]">+50 pts</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            Longest Streak: <strong className="text-[var(--tt-text)]">+25 pts/day</strong>
          </span>
        </div>
      </div>

      {/* 3. Medal Showcase Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="tt-title font-semibold text-[var(--tt-text)]">
            Milestone Medals & Badges
          </h4>
          <span className="tt-meta text-[var(--tt-muted)]">
            {unlockedBadges.length} unlocked
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((badge) => {
            const isUnlocked = badge.unlocked;
            const pct = Math.min(100, Math.round((badge.progress / badge.maxProgress) * 100));

            return (
              <div
                key={badge.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                  isUnlocked
                    ? "border-[var(--tt-border)] bg-[var(--tt-panel)] shadow-sm hover:border-[var(--tt-accent)]"
                    : "border-[var(--tt-border)]/40 bg-[var(--tt-panel)]/40 opacity-75"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold shadow-xs ${
                        isUnlocked
                          ? "bg-gradient-to-br from-[var(--tt-accent)] to-sky-500 text-white"
                          : "bg-[var(--tt-panel-alt)] text-[var(--tt-muted)] border border-[var(--tt-border)]"
                      }`}
                    >
                      {BADGE_ICONS[badge.icon] || <Trophy className="h-5 w-5" />}
                    </div>

                    {isUnlocked ? (
                      <span className="rounded-full bg-emerald-500/15 text-emerald-500 px-2 py-0.5 tt-meta font-bold">
                        Unlocked
                      </span>
                    ) : (
                      <span className="rounded-full bg-[var(--tt-panel-alt)] text-[var(--tt-muted)] px-2 py-0.5 tt-meta font-bold flex items-center gap-1 border border-[var(--tt-border)]/50">
                        <Lock className="h-3 w-3" />
                        Locked
                      </span>
                    )}
                  </div>

                  <h5 className="tt-heading font-semibold text-[var(--tt-text)]">
                    {badge.title}
                  </h5>

                  <p className="tt-body text-[var(--tt-muted)] text-xs mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                {/* Progress bar for locked badges */}
                {!isUnlocked && (
                  <div className="mt-4 pt-3 border-t border-[var(--tt-border)]/40 space-y-1">
                    <div className="flex justify-between tt-meta font-medium text-[var(--tt-muted)] text-[11px]">
                      <span>Progress</span>
                      <span>{badge.progress} / {badge.maxProgress}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[var(--tt-panel-alt)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--tt-accent)]/80"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
