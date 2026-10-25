"use client";

import React, { useEffect } from "react";
import { Sparkles, Trophy, Flame, X } from "lucide-react";
import { playHabitChimeSound } from "@/lib/sound-utils";

export interface HabitEncouragementProps {
  habitTitle: string;
  streak: number;
  encouragement?: string | null;
  color?: string;
  onDismiss: () => void;
}

const DEFAULT_QUOTES = [
  "Small steps every day create massive results over time.",
  "Consistency is the foundation of genuine mastery.",
  "You showed up today. That is what separates intent from progress.",
  "Every repetition rewires your habits for effortless discipline.",
  "Another day, another promise kept to yourself.",
];

export function HabitEncouragementToast({
  habitTitle,
  streak,
  encouragement,
  color = "var(--tt-accent)",
  onDismiss,
}: HabitEncouragementProps) {
  useEffect(() => {
    playHabitChimeSound();
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const quote =
    encouragement ||
    DEFAULT_QUOTES[Math.floor(Math.random() * DEFAULT_QUOTES.length)];

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel)] p-4 shadow-2xl backdrop-blur-md">
        {/* Glow accent */}
        <div
          className="absolute -top-12 -right-12 h-28 w-28 rounded-full opacity-20 blur-2xl pointer-events-none"
          style={{ backgroundColor: color }}
        />

        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-md"
            style={{ backgroundColor: color }}
          >
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <span className="tt-label font-bold text-[var(--tt-text)] truncate">
                {habitTitle} completed!
              </span>
              {streak > 0 && (
                <span className="flex items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.5 tt-meta font-bold text-amber-500 shrink-0">
                  <Flame className="h-3 w-3 fill-current" />
                  {streak}d
                </span>
              )}
            </div>

            <p className="tt-body text-[var(--tt-muted)] text-xs mt-1 italic leading-relaxed">
              &ldquo;{quote}&rdquo;
            </p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg p-1 text-[var(--tt-muted)] hover:text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
