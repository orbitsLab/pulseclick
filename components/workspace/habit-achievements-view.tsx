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
    <div className="space-y-4">
      {/* 1. Level & Score Banner */}
      <div className="overflow-hidden rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-[6px] bg-[var(--app-hover)] text-[var(--app-accent)] border border-[var(--app-border)]">
              <Award className="h-6 w-6 stroke-[2]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-[3px] bg-[rgba(35,131,226,0.12)] text-[#2383e2] dark:text-[#529cca] border border-[rgba(35,131,226,0.25)] px-2 py-0.5 text-[10px] font-medium">
                  LEVEL {level.level}
                </span>
                <span className="text-xs text-[var(--app-muted)]">
                  {unlockedBadges.length} of {badges.length} Medals Unlocked
                </span>
              </div>

              <h3 className="text-base font-semibold text-[var(--app-text)] mt-1">
                {level.title}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider">
              ACHIEVEMENT SCORE
            </span>
            <div className="text-2xl font-semibold text-[var(--app-text)] font-mono tabular-nums">
              {score}
              <span className="text-xs font-normal text-[var(--app-muted)] ml-1">pts</span>
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="mt-4 pt-3 border-t border-[var(--app-border)] space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-[var(--app-muted)] font-mono">
            <span>Next Level: {level.nextScore} pts</span>
            <span>{level.progressPct}% to Level {level.level + 1}</span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--app-hover)]">
            <div
              className="h-full rounded-full bg-[var(--app-accent)] transition-all duration-500"
              style={{ width: `${level.progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Scoring System Card */}
      <div className="rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[var(--app-accent)]" />
          <span className="text-xs font-semibold text-[var(--app-text)]">
            How Points Are Earned:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--app-muted)]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Check-in: <strong className="text-[var(--app-text)] font-mono">+10 pts</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-[var(--app-accent)]" />
            Target Cycle: <strong className="text-[var(--app-text)] font-mono">+50 pts</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            Longest Streak: <strong className="text-[var(--app-text)] font-mono">+25 pts/day</strong>
          </span>
        </div>
      </div>

      {/* 3. Medal Showcase Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-semibold text-[var(--app-text)]">
            Milestone Medals & Badges
          </h4>
          <span className="text-xs text-[var(--app-muted)]">
            {unlockedBadges.length} unlocked
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((badge) => {
            const isUnlocked = badge.unlocked;
            const pct = Math.min(100, Math.round((badge.progress / badge.maxProgress) * 100));

            return (
              <div
                key={badge.id}
                className={`relative flex flex-col justify-between rounded-[8px] border p-3.5 transition-colors ${
                  isUnlocked
                    ? "border-[var(--app-border)] bg-[var(--app-panel)] hover:border-[var(--app-border)]"
                    : "border-[var(--app-border)] bg-[var(--app-panel)] opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-[4px] font-medium ${
                        isUnlocked
                          ? "bg-[rgba(35,131,226,0.12)] text-[#2383e2] dark:text-[#529cca] border border-[rgba(35,131,226,0.25)]"
                          : "bg-[var(--app-hover)] text-[var(--app-muted)] border border-[var(--app-border)]"
                      }`}
                    >
                      {BADGE_ICONS[badge.icon] || <Trophy className="h-4 w-4" />}
                    </div>

                    {isUnlocked ? (
                      <span className="rounded-[3px] bg-[rgba(68,131,97,0.1)] text-[#448361] dark:text-[#4dab9a] border border-[rgba(68,131,97,0.25)] px-1.5 py-0.5 text-[10px] font-medium">
                        Unlocked
                      </span>
                    ) : (
                      <span className="rounded-[3px] bg-[var(--app-hover)] text-[var(--app-muted)] px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-1 border border-[var(--app-border)]">
                        <Lock className="h-2.5 w-2.5" />
                        Locked
                      </span>
                    )}
                  </div>

                  <h5 className="text-xs font-semibold text-[var(--app-text)]">
                    {badge.title}
                  </h5>

                  <p className="text-xs text-[var(--app-muted)] mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                {/* Progress bar for locked badges */}
                {!isUnlocked && (
                  <div className="mt-3 pt-2.5 border-t border-[var(--app-border)] space-y-1">
                    <div className="flex justify-between font-mono text-[10px] text-[var(--app-muted)]">
                      <span>Progress</span>
                      <span>{badge.progress} / {badge.maxProgress}</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-[var(--app-hover)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--app-accent)]"
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
