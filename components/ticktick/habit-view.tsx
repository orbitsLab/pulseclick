"use client";

import React, { useState } from "react";
import {
  Flame,
  Plus,
  Check,
  Trash2,
  Trophy,
  Dumbbell,
  BookOpen,
  Droplets,
  Heart,
  Coffee,
  Smile,
  Target,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Habit } from "@/hooks/use-ticktick";
import { getTodayISO, getMondayOfWeek, getWeekDays } from "@/lib/date-utils";

interface HabitViewProps {
  habits: Habit[];
  onToggleHabitCheck: (params: { habitId: string; date: string }) => void;
  onAddHabit: (params: {
    title: string;
    icon?: string;
    color?: string;
    frequency?: string;
    targetDays?: number;
  }) => Promise<any>;
  onDeleteHabit: (habitId: string) => Promise<any>;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Flame: <Flame className="h-4 w-4" />,
  Dumbbell: <Dumbbell className="h-4 w-4" />,
  BookOpen: <BookOpen className="h-4 w-4" />,
  Droplets: <Droplets className="h-4 w-4" />,
  Heart: <Heart className="h-4 w-4" />,
  Coffee: <Coffee className="h-4 w-4" />,
  Smile: <Smile className="h-4 w-4" />,
  Target: <Target className="h-4 w-4" />,
  Sparkles: <Sparkles className="h-4 w-4" />,
};

const COLOR_PALETTE = [
  "#14b8a6", // Teal
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f59e0b", // Amber
  "#10b981", // Emerald
];

export function HabitView({
  habits,
  onToggleHabitCheck,
  onAddHabit,
  onDeleteHabit,
}: HabitViewProps) {
  const today = getTodayISO();
  const weekMonday = getMondayOfWeek(today);
  const weekDays = getWeekDays(weekMonday);

  // New Habit Dialog State
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Flame");
  const [selectedColor, setSelectedColor] = useState("#14b8a6");
  const [frequency, setFrequency] = useState("DAILY");
  const [targetDays, setTargetDays] = useState(7);

  const completedTodayCount = habits.filter((h) =>
    h.logs?.some((l) => l.date === today && l.completed)
  ).length;

  const totalHabits = habits.length;
  const progressPercent = totalHabits > 0 ? (completedTodayCount / totalHabits) * 100 : 0;

  async function handleCreateHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    await onAddHabit({
      title: title.trim(),
      icon: selectedIcon,
      color: selectedColor,
      frequency,
      targetDays,
    });

    setTitle("");
    setShowAddModal(false);
  }

  return (
    <div className="flex-1 flex flex-col rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel)] p-4 shadow-sm transition-colors sm:p-6 overflow-hidden">
      {/* Top Header Card: Today's progress */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-[var(--tt-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--tt-accent)]/10 px-2 py-0.5 tt-label font-semibold text-[var(--tt-accent-text)]">
              {completedTodayCount}/{totalHabits} Today
            </span>
          </div>
          <p className="tt-body text-[var(--tt-muted)] mt-0.5">
            Consistent small routines create massive results over time.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--tt-accent-strong)] px-3.5 py-1.5 tt-label font-semibold text-white shadow-md shadow-[var(--tt-accent)]/25 hover:bg-[var(--tt-accent-strong)] transition-all active:scale-95"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Progress Bar */}
      {totalHabits > 0 && (
        <div className="mb-6 space-y-1.5">
          <div className="flex justify-between tt-overline font-semibold text-[var(--tt-muted)]">
            <span>TODAY&apos;S COMPLETION</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--tt-panel-alt)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--tt-accent)] to-indigo-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Habits List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-[var(--tt-muted)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--tt-accent)]/10 text-[var(--tt-accent-text)] mb-3">
              <Flame className="h-7 w-7" />
            </div>
            <h3 className="tt-heading font-semibold text-[var(--tt-text)]">
              No habits created yet
            </h3>
            <p className="tt-label text-[var(--tt-muted)] mt-1 max-w-sm">
              Click &quot;New Habit&quot; above to start tracking your daily routines like reading, exercise, or meditation!
            </p>
          </div>
        ) : (
          habits.map((habit) => {
            const isCompletedToday = habit.logs?.some(
              (l) => l.date === today && l.completed
            );

            return (
              <div
                key={habit.id}
                className="group flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--tt-border)]/80 bg-[var(--tt-panel)] p-3.5 transition-all hover:shadow-sm dark:hover:bg-[var(--tt-panel-alt)]/40"
              >
                {/* Left: Icon & Title & Streak */}
                <div className="flex items-center gap-3 min-w-[220px]">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-xs"
                    style={{ backgroundColor: habit.color }}
                  >
                    {ICON_MAP[habit.icon] || <Flame className="h-4 w-4" />}
                  </div>

                  <div>
                    <h4 className="tt-heading font-semibold text-[var(--tt-text)]">
                      {habit.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5 tt-meta font-bold text-amber-500">
                        <Flame className="h-3 w-3 fill-current" />
                        {habit.streak} day streak
                      </span>
                      <span className="tt-meta text-[var(--tt-muted)]">•</span>
                      <span className="tt-meta text-[var(--tt-muted)]">
                        {habit.frequency === "DAILY" ? "Daily" : `${habit.targetDays}x/week`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: 7-Day interactive check-in circles (Mon-Sun) */}
                <div className="flex items-center gap-2">
                  {weekDays.map((day) => {
                    const isChecked = habit.logs?.some(
                      (l) => l.date === day.iso && l.completed
                    );
                    const isToday = day.iso === today;

                    return (
                      <div
                        key={day.iso}
                        className="flex flex-col items-center gap-1"
                      >
                        <span className="tt-overline font-semibold text-[var(--tt-muted)]">
                          {day.shortName[0]}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onToggleHabitCheck({ habitId: habit.id, date: day.iso })
                          }
                          title={`${day.shortName} (${day.iso}) - Click to toggle check-in`}
                          className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all active:scale-90 ${ isChecked ? "border-transparent text-white shadow-xs font-bold" : "border-[var(--tt-border)] bg-[var(--tt-panel-alt)] hover:border-[var(--tt-border)] dark:border-[var(--tt-border)] dark:hover:border-[var(--tt-border)]" } ${isToday ? "ring-2 ring-[var(--tt-accent)] ring-offset-1 dark:ring-offset-slate-900" : ""}`}
                          style={{
                            backgroundColor: isChecked ? habit.color : undefined,
                          }}
                        >
                          {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </button>
                      </div>
                    );
                  })}

                  {/* Delete Button on hover */}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete habit "${habit.title}"?`)) {
                        onDeleteHabit(habit.id);
                      }
                    }}
                    title="Delete habit"
                    className="ml-2 rounded-lg p-1.5 text-[var(--tt-muted)] opacity-0 group-hover:opacity-100 hover:text-rose-500 hover:bg-[var(--tt-panel-alt)] transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-rail)] p-5 text-[var(--tt-text)] shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="tt-heading font-semibold text-white mb-4">Create New Habit</h3>

            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
                  Habit Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Read 20 mins, Drink 2L Water, Workout"
                  className="w-full rounded-xl border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-3 py-2 tt-label text-white focus:outline-none focus:border-[var(--tt-accent)]"
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1.5">
                  Select Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(ICON_MAP).map((iconKey) => (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setSelectedIcon(iconKey)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${ selectedIcon === iconKey ? "border-[var(--tt-accent)] bg-[var(--tt-accent)]/20 text-[var(--tt-accent-text)]" : "border-[var(--tt-border)] bg-[var(--tt-panel-alt)]/80 text-[var(--tt-muted)] hover:text-white" }`}
                    >
                      {ICON_MAP[iconKey]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1.5">
                  Color Theme
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`h-6 w-6 rounded-full transition-transform ${ selectedColor === c ? "scale-110 ring-2 ring-[var(--tt-panel)] ring-offset-2 ring-offset-[var(--tt-panel)]" : "opacity-80 hover:opacity-100" }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div className="grid grid-cols-2 gap-2 tt-label">
                <div>
                  <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full rounded-xl border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-3 py-2 tt-label text-white focus:outline-none focus:border-[var(--tt-accent)]"
                  >
                    <option value="DAILY">Every Day</option>
                    <option value="WEEKLY">Weekly Target</option>
                  </select>
                </div>

                <div>
                  <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
                    Days / Week
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={targetDays}
                    onChange={(e) => setTargetDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-3 py-2 tt-label text-white focus:outline-none focus:border-[var(--tt-accent)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--tt-border)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg px-3 py-1.5 tt-label text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--tt-accent-strong)] px-4 py-1.5 tt-label font-semibold text-white hover:bg-[var(--tt-accent-strong)] shadow-md shadow-[var(--tt-accent)]/25"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
