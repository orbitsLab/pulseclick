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
import { HabitAnalyticsData } from "@/hooks/use-workspace";

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
      <div className="relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-gradient-to-br from-[var(--app-panel)] via-[var(--app-panel)] to-[var(--app-panel-alt)] p-6 shadow-sm">
        {/* Glow orb */}
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[var(--app-accent)] opacity-15 blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--app-accent)] to-sky-500 text-white shadow-lg shadow-[var(--app-accent)]/25">
              <Award className="h-8 w-8 stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--app-accent)]/20 text-[var(--app-accent-text)] px-2.5 py-0.5 app-meta font-bold">
                  LEVEL {level.level}
                </span>
                <span className="app-meta text-[var(--app-muted)]">
                  {unlockedBadges.length} of {badges.length} Medals Unlocked
                </span>
              </div>

              <h3 className="app-display text-2xl font-serif text-[var(--app-text)] mt-1">
                {level.title}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="app-overline font-semibold text-[var(--app-muted)] text-[10px]">
              ACHIEVEMENT SCORE
            </span>
            <div className="app-figure text-3xl font-bold text-[var(--app-accent-text)]">
              {score}
              <span className="app-meta font-normal text-[var(--app-muted)] ml-1">pts</span>
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="mt-6 pt-4 border-t border-[var(--app-border)]/60 space-y-2 relative z-10">
          <div className="flex justify-between app-meta font-semibold text-[var(--app-muted)]">
            <span>Next Level: {level.nextScore} pts</span>
            <span>{level.progressPct}% to Level {level.level + 1}</span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--app-panel-alt)] border border-[var(--app-border)]/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--app-accent)] via-sky-400 to-indigo-500 transition-all duration-700"
              style={{ width: `${level.progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Scoring System Card */}
      <div className="rounded-2xl border border-[var(--app-border)]/80 bg-[var(--app-panel)] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--app-accent-text)]" />
          <span className="app-label font-bold text-[var(--app-text)]">
            How Points Are Earned:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 app-meta font-medium text-[var(--app-muted)]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Check-in: <strong className="text-[var(--app-text)]">+10 pts</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-[var(--app-accent-text)]" />
            Target Cycle: <strong className="text-[var(--app-text)]">+50 pts</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            Longest Streak: <strong className="text-[var(--app-text)]">+25 pts/day</strong>
          </span>
        </div>
      </div>

      {/* 3. Medal Showcase Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="app-title font-semibold text-[var(--app-text)]">
            Milestone Medals & Badges
          </h4>
          <span className="app-meta text-[var(--app-muted)]">
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
                    ? "border-[var(--app-border)] bg-[var(--app-panel)] shadow-sm hover:border-[var(--app-accent)]"
                    : "border-[var(--app-border)]/40 bg-[var(--app-panel)]/40 opacity-75"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold shadow-xs ${
                        isUnlocked
                          ? "bg-gradient-to-br from-[var(--app-accent)] to-sky-500 text-white"
                          : "bg-[var(--app-panel-alt)] text-[var(--app-muted)] border border-[var(--app-border)]"
                      }`}
                    >
                      {BADGE_ICONS[badge.icon] || <Trophy className="h-5 w-5" />}
                    </div>

                    {isUnlocked ? (
                      <span className="rounded-full bg-emerald-500/15 text-emerald-500 px-2 py-0.5 app-meta font-bold">
                        Unlocked
                      </span>
                    ) : (
                      <span className="rounded-full bg-[var(--app-panel-alt)] text-[var(--app-muted)] px-2 py-0.5 app-meta font-bold flex items-center gap-1 border border-[var(--app-border)]/50">
                        <Lock className="h-3 w-3" />
                        Locked
                      </span>
                    )}
                  </div>

                  <h5 className="app-heading font-semibold text-[var(--app-text)]">
                    {badge.title}
                  </h5>

                  <p className="app-body text-[var(--app-muted)] text-xs mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                {/* Progress bar for locked badges */}
                {!isUnlocked && (
                  <div className="mt-4 pt-3 border-t border-[var(--app-border)]/40 space-y-1">
                    <div className="flex justify-between app-meta font-medium text-[var(--app-muted)] text-[11px]">
                      <span>Progress</span>
                      <span>{badge.progress} / {badge.maxProgress}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[var(--app-panel-alt)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--app-accent)]/80"
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
