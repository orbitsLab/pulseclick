"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  Calendar as CalendarIcon,
  Flame,
  Timer,
  MoreHorizontal,
  GanttChartSquare,
  Grid2x2,
  TimerReset,
  BarChart3,
  Settings2,
  Sun,
  Moon,
  Palette,
  LogOut,
  X,
} from "lucide-react";
import { WorkspaceModule } from "./module-rail";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  activeModule: WorkspaceModule;
  onSelectModule: (mod: WorkspaceModule) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenThemePicker?: () => void;
  user: { email: string; name?: string | null } | null;
  onLogout: () => void;
}

export function MobileBottomNav({
  activeModule,
  onSelectModule,
  isDark,
  onToggleTheme,
  onOpenThemePicker,
  user,
  onLogout,
}: MobileBottomNavProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const coreModules: { id: WorkspaceModule; label: string; icon: React.ReactNode }[] = [
    { id: "tasks", label: "Tasks", icon: <CheckSquare className="h-5 w-5" /> },
    { id: "calendar", label: "Calendar", icon: <CalendarIcon className="h-5 w-5" /> },
    { id: "habits", label: "Habits", icon: <Flame className="h-5 w-5" /> },
    { id: "pomodoro", label: "Focus", icon: <Timer className="h-5 w-5" /> },
  ];

  const moreModules: { id: WorkspaceModule; label: string; description: string; icon: React.ReactNode }[] = [
    {
      id: "timeline",
      label: "Timeline",
      description: "Gantt-style time blocking and schedule view",
      icon: <GanttChartSquare className="h-5 w-5 text-indigo-400" />,
    },
    {
      id: "matrix",
      label: "Eisenhower Matrix",
      description: "Prioritize by urgency and importance",
      icon: <Grid2x2 className="h-5 w-5 text-amber-400" />,
    },
    {
      id: "countdown",
      label: "Countdowns",
      description: "Track milestones and upcoming deadlines",
      icon: <TimerReset className="h-5 w-5 text-rose-400" />,
    },
    {
      id: "statistics",
      label: "Statistics",
      description: "Review productivity metrics and focus trends",
      icon: <BarChart3 className="h-5 w-5 text-emerald-400" />,
    },
    {
      id: "settings",
      label: "Settings",
      description: "Workspace preferences and account settings",
      icon: <Settings2 className="h-5 w-5 text-sky-400" />,
    },
  ];

  const isMoreActive = !coreModules.some((m) => m.id === activeModule);

  const handleSelectMoreModule = (mod: WorkspaceModule) => {
    onSelectModule(mod);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex items-center justify-around border-t border-[var(--app-border)]/80 bg-[var(--app-rail)]/95 px-2 py-1.5 backdrop-blur-lg select-none pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]"
      >
        {coreModules.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setIsMoreOpen(false);
                onSelectModule(item.id);
              }}
              className={cn(
                "flex flex-1 min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-xs transition-all active:scale-95 cursor-pointer",
                isActive
                  ? "text-[var(--app-accent-text)] font-bold"
                  : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                  isActive && "bg-[var(--app-accent)]/15"
                )}
              >
                {item.icon}
              </div>
              <span className="app-meta leading-none">{item.label}</span>
            </button>
          );
        })}

        {/* More Button */}
        <button
          type="button"
          onClick={() => setIsMoreOpen((prev) => !prev)}
          className={cn(
            "flex flex-1 min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-xs transition-all active:scale-95 cursor-pointer",
            isMoreActive || isMoreOpen
              ? "text-[var(--app-accent-text)] font-bold"
              : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
          )}
        >
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
              (isMoreActive || isMoreOpen) && "bg-[var(--app-accent)]/15"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
          </div>
          <span className="app-meta leading-none">More</span>
        </button>
      </nav>

      {/* "More" Action Sheet Overlay */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Sheet Body */}
          <div className="relative z-10 w-full max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-[var(--app-border)] bg-[var(--app-rail)] p-4 text-[var(--app-text)] shadow-2xl animate-in slide-in-from-bottom duration-200 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            {/* Sheet Handle & Close Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--app-border)]/80">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--app-accent)]" />
                <h3 className="app-heading font-semibold text-[var(--app-text)]">
                  More Modules & Tools
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--app-muted)] hover:bg-[var(--app-panel-alt)] hover:text-[var(--app-text)] cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modules List */}
            <div className="space-y-1.5 py-1">
              {moreModules.map((item) => {
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectMoreModule(item.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all active:scale-98 cursor-pointer",
                      isActive
                        ? "bg-[var(--app-accent)]/15 border border-[var(--app-accent)]/40 text-[var(--app-accent-text)] font-semibold"
                        : "bg-[var(--app-panel-alt)]/60 hover:bg-[var(--app-panel-alt)] border border-[var(--app-border)]/60 text-[var(--app-text)]"
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--app-panel)] shadow-xs">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="app-label font-semibold">{item.label}</div>
                      <div className="app-meta text-[var(--app-muted)] truncate">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Utility Actions: Theme, Theme Picker, Account */}
            <div className="mt-4 pt-3 border-t border-[var(--app-border)]/80 space-y-2">
              <div className="flex items-center gap-2">
                {onOpenThemePicker && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreOpen(false);
                      onOpenThemePicker();
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel-alt)] py-2 app-label font-medium text-[var(--app-text)] hover:bg-[var(--app-panel)] transition-colors cursor-pointer"
                  >
                    <Palette className="h-4 w-4 text-[var(--app-muted)]" />
                    <span>Themes</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel-alt)] py-2 app-label font-medium text-[var(--app-text)] hover:bg-[var(--app-panel)] transition-colors cursor-pointer"
                >
                  {isDark ? (
                    <>
                      <Sun className="h-4 w-4 text-amber-400" />
                      <span>Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-indigo-400" />
                      <span>Dark</span>
                    </>
                  )}
                </button>
              </div>

              {/* User row and logout */}
              <div className="flex items-center justify-between rounded-xl bg-[var(--app-panel-alt)]/40 p-2.5 border border-[var(--app-border)]/50">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent)]/20 text-[var(--app-accent-text)] app-label font-bold">
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="app-meta font-medium text-[var(--app-muted)] truncate">
                    {user?.email || "Account"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
