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
  color = "var(--app-accent)",
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
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-3 fade-in duration-150">
      <div className="relative overflow-hidden rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3.5 shadow-xl">
        <div className="flex items-start gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-white"
            style={{ backgroundColor: color }}
          >
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-[var(--app-text)] truncate">
                {habitTitle} completed!
              </span>
              {streak > 0 && (
                <span className="inline-flex items-center gap-0.5 rounded-[3px] bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-mono font-medium text-amber-600 dark:text-amber-400 shrink-0">
                  <Flame className="h-3 w-3 fill-current" />
                  {streak}d
                </span>
              )}
            </div>

            <p className="text-xs text-[var(--app-muted)] mt-1 italic leading-relaxed">
              &ldquo;{quote}&rdquo;
            </p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="rounded-[4px] p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-panel-hover)] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
