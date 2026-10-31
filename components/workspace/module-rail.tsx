"use client";

import React from "react";
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
  GanttChartSquare,
  BarChart3,
  TimerReset,
  Settings2,
} from "lucide-react";
import { SideTooltip } from "@/components/ui/tooltip";

export type WorkspaceModule =
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
  activeModule: WorkspaceModule;
  onSelectModule: (mod: WorkspaceModule) => void;
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
  const modules: { id: WorkspaceModule; label: string; shortcut: string; icon: React.ReactNode }[] = [
    { id: "tasks", label: "Tasks", shortcut: "1", icon: <CheckSquare className="h-4.5 w-4.5" /> },
    { id: "calendar", label: "Calendar", shortcut: "2", icon: <CalendarIcon className="h-4.5 w-4.5" /> },
    { id: "timeline", label: "Timeline", shortcut: "3", icon: <GanttChartSquare className="h-4.5 w-4.5" /> },
    { id: "habits", label: "Habits", shortcut: "4", icon: <Flame className="h-4.5 w-4.5" /> },
    { id: "matrix", label: "Eisenhower Matrix", shortcut: "5", icon: <Grid2x2 className="h-4.5 w-4.5" /> },
    { id: "pomodoro", label: "Pomodoro Focus", shortcut: "6", icon: <Timer className="h-4.5 w-4.5" /> },
    { id: "countdown", label: "Countdowns", shortcut: "7", icon: <TimerReset className="h-4.5 w-4.5" /> },
    { id: "statistics", label: "Statistics", shortcut: "8", icon: <BarChart3 className="h-4.5 w-4.5" /> },
    { id: "settings", label: "Settings", shortcut: "9", icon: <Settings2 className="h-4.5 w-4.5" /> },
  ];

  return (
    <aside className="hidden md:flex flex-col items-center justify-between border-r border-[var(--app-border)] bg-[var(--app-rail)] py-3 px-1.5 text-[var(--app-muted)] select-none z-30 w-14 flex-shrink-0">
      {/* Notion Workspace Brand Mark */}
      <div className="flex flex-col items-center gap-3">
        <SideTooltip
          content="PulseFlow Workspace"
          description="Productivity & Habit Tracker"
          side="right"
          sideOffset={12}
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-text)] font-semibold text-xs shadow-xs cursor-pointer hover:bg-[var(--app-hover)] transition-colors"
          >
            <span className="text-[var(--app-accent)] font-bold">P</span>
          </div>
        </SideTooltip>

        {/* Navigation module icons */}
        <nav className="flex flex-col items-center gap-1 mt-1">
          {modules.map((m) => {
            const isActive = activeModule === m.id;
            return (
              <SideTooltip
                key={m.id}
                content={m.label}
                shortcut={m.shortcut}
                side="right"
                sideOffset={12}
              >
                <button
                  type="button"
                  onClick={() => onSelectModule(m.id)}
                  aria-label={m.label}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-[5px] transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[var(--app-panel)] text-[var(--app-accent)] border border-[var(--app-border)] shadow-xs"
                      : "text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)]"
                  }`}
                >
                  {m.icon}
                  {isActive && (
                    <span className="absolute -left-1.5 top-2 bottom-2 w-0.5 rounded-r-full bg-[var(--app-accent)]" />
                  )}
                </button>
              </SideTooltip>
            );
          })}
        </nav>
      </div>

      {/* Bottom controls: Theme picker, Theme toggle, Logout */}
      <div className="flex flex-col items-center gap-1.5">
        {onOpenThemePicker && (
          <SideTooltip content="Themes" description="Customize interface theme" side="right" sideOffset={12}>
            <button
              type="button"
              onClick={onOpenThemePicker}
              aria-label="Themes"
              className="flex h-8 w-8 items-center justify-center rounded-[5px] text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)] transition-colors cursor-pointer"
            >
              <Palette className="h-4 w-4" />
            </button>
          </SideTooltip>
        )}

        <SideTooltip
          content={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          side="right"
          sideOffset={12}
        >
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="flex h-8 w-8 items-center justify-center rounded-[5px] text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)] transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </SideTooltip>

        {user && (
          <SideTooltip
            content="Sign out"
            description={user.email}
            side="right"
            sideOffset={12}
          >
            <button
              type="button"
              onClick={onLogout}
              aria-label={`Sign out (${user.email})`}
              className="flex h-8 w-8 items-center justify-center rounded-[5px] text-[var(--app-muted)] hover:bg-[#e03e3e]/15 hover:text-[#e03e3e] transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </SideTooltip>
        )}
      </div>
    </aside>
  );
}
