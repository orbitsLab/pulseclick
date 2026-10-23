"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  Calendar as CalendarIcon,
  Flame,
  Grid2x2,
  Timer,
  Sun,
  Moon,
  LogOut,
  Palette,
  Check,
  GanttChartSquare,
  BarChart3,
  TimerReset,
  Settings2,
} from "lucide-react";

export type TickTickModule =
  | "tasks"
  | "calendar"
  | "timeline"
  | "habits"
  | "matrix"
  | "pomodoro"
  | "countdown"
  | "statistics"
  | "settings";

interface ModuleRailProps {
  activeModule: TickTickModule;
  onSelectModule: (mod: TickTickModule) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  user: { email: string; name?: string | null } | null;
  onLogout: () => void;
  onOpenThemePicker?: () => void;
}

export function ModuleRail({
  activeModule,
  onSelectModule,
  isDark,
  onToggleTheme,
  user,
  onLogout,
  onOpenThemePicker,
}: ModuleRailProps) {
  const modules: { id: TickTickModule; label: string; icon: React.ReactNode }[] = [
    { id: "tasks", label: "Tasks", icon: <CheckSquare className="h-5 w-5" /> },
    { id: "calendar", label: "Calendar", icon: <CalendarIcon className="h-5 w-5" /> },
    { id: "timeline", label: "Timeline", icon: <GanttChartSquare className="h-5 w-5" /> },
    { id: "habits", label: "Habits", icon: <Flame className="h-5 w-5" /> },
    { id: "matrix", label: "Eisenhower Matrix", icon: <Grid2x2 className="h-5 w-5" /> },
    { id: "pomodoro", label: "Pomodoro Focus", icon: <Timer className="h-5 w-5" /> },
    { id: "countdown", label: "Countdowns", icon: <TimerReset className="h-5 w-5" /> },
    { id: "statistics", label: "Statistics", icon: <BarChart3 className="h-5 w-5" /> },
    { id: "settings", label: "Settings", icon: <Settings2 className="h-5 w-5" /> },
  ];

  return (
    <aside className="flex flex-col items-center justify-between border-r border-[var(--tt-border)] bg-[var(--tt-rail)] py-4 px-2 text-[var(--tt-muted)] select-none z-30 w-16 flex-shrink-0">
      {/* Brand icon / User avatar */}
      <div className="flex flex-col items-center gap-4">
        <div
          title="PulseTick"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--tt-accent)] to-indigo-600 font-extrabold text-white text-xl shadow-md shadow-[var(--tt-accent)]/25 cursor-pointer"
        >
          ✓
        </div>

        {/* Navigation module icons */}
        <nav className="flex flex-col items-center gap-2 mt-2">
          {modules.map((m) => {
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectModule(m.id)}
                title={m.label}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 ${ isActive ? "bg-[var(--tt-accent-strong)] text-white shadow-lg shadow-[var(--tt-accent)]/30 font-bold" : "text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)] hover:text-[var(--tt-text)]" }`}
              >
                {m.icon}
                {isActive && (
                  <span className="absolute -left-2 top-2 bottom-2 w-1 rounded-r-full bg-[var(--tt-accent)]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom controls: Theme picker, Theme toggle, Logout */}
      <div className="flex flex-col items-center gap-3">
        {onOpenThemePicker && (
          <button
            type="button"
            onClick={onOpenThemePicker}
            title="Themes"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)] hover:text-[var(--tt-accent-text)] transition-colors"
          >
            <Palette className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onToggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)] hover:text-amber-400 transition-colors"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {user && (
          <button
            type="button"
            onClick={onLogout}
            title={`Sign out (${user.email})`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--tt-muted)] hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
