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
                "flex flex-1 min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-[4px] py-1 text-xs transition-colors cursor-pointer",
                isActive
                  ? "text-[var(--app-accent)] font-medium"
                  : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-[4px] transition-colors",
                  isActive && "bg-[var(--app-accent-tag-bg)] text-[var(--app-accent)]"
                )}
              >
                {item.icon}
              </div>
              <span className="text-[10px] leading-none">{item.label}</span>
            </button>
          );
        })}

        {/* More Button */}
        <button
          type="button"
          onClick={() => setIsMoreOpen((prev) => !prev)}
          className={cn(
            "flex flex-1 min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-[4px] py-1 text-xs transition-colors cursor-pointer",
            isMoreActive || isMoreOpen
              ? "text-[var(--app-accent)] font-medium"
              : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
          )}
        >
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-[4px] transition-colors",
              (isMoreActive || isMoreOpen) && "bg-[var(--app-accent-tag-bg)] text-[var(--app-accent)]"
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
          <div className="relative z-10 w-full max-h-[85vh] overflow-y-auto rounded-t-[12px] border-t border-[var(--app-border)] bg-[var(--app-panel)] p-4 text-[var(--app-text)] shadow-2xl animate-in slide-in-from-bottom duration-200 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            {/* Sheet Handle & Close Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--app-border)]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--app-accent)]" />
                <h3 className="text-sm font-semibold text-[var(--app-text)]">
                  More Modules & Tools
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-[4px] text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)] cursor-pointer"
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
                      "flex w-full items-center gap-3 rounded-[6px] p-2.5 text-left transition-colors cursor-pointer",
                      isActive
                        ? "bg-[var(--app-hover)] border border-[var(--app-accent)] text-[var(--app-text)] font-semibold"
                        : "bg-[var(--app-panel)] hover:bg-[var(--app-hover)] border border-[var(--app-border)] text-[var(--app-text)]"
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] bg-[var(--app-hover)]">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold">{item.label}</div>
                      <div className="text-[11px] text-[var(--app-muted)] truncate">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Utility Actions: Theme, Theme Picker, Account */}
            <div className="mt-4 pt-3 border-t border-[var(--app-border)] space-y-2">
              <div className="flex items-center gap-2">
                {onOpenThemePicker && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreOpen(false);
                      onOpenThemePicker();
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] py-1.5 text-xs font-medium text-[var(--app-text)] hover:bg-[var(--app-hover)] transition-colors cursor-pointer"
                  >
                    <Palette className="h-3.5 w-3.5 text-[var(--app-muted)]" />
                    <span>Themes</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="flex flex-1 items-center justify-center gap-2 rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] py-1.5 text-xs font-medium text-[var(--app-text)] hover:bg-[var(--app-hover)] transition-colors cursor-pointer"
                >
                  {isDark ? (
                    <>
                      <Sun className="h-3.5 w-3.5 text-amber-400" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-3.5 w-3.5 text-slate-400" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>
              </div>

              {/* User Account / Logout */}
              {user && (
                <div className="flex items-center justify-between rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] p-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[var(--app-text)]">
                      {user.name || user.email}
                    </p>
                    <p className="truncate text-[10px] text-[var(--app-muted)]">
                      {user.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex items-center gap-1 rounded-[4px] px-2 py-1 text-xs font-medium text-rose-500 hover:bg-[rgba(255,0,26,0.1)] transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
