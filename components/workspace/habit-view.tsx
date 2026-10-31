"use client";

import React, { useState, useContext, useMemo, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  Footprints,
  Moon,
  Sun,
  Activity,
  Archive,
  ArchiveRestore,
  Pencil,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Minus,
  SkipForward,
  FolderPlus,
  StickyNote,
  CalendarDays,
  BarChart3,
  Bell,
  Clock,
  LineChart,
} from "lucide-react";
import { Habit, HabitSection } from "@/hooks/use-workspace";
import { getTodayISO, getMondayOfWeek, getWeekDays, addDays } from "@/lib/date-utils";
import { WorkspaceContext } from "@/context/workspace-context";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { SlideActionButton } from "@/components/motion/slide-action-button";
import { HabitHeatmapView } from "./habit-heatmap-view";
import { HabitStatsView } from "./habit-stats-view";
import { HabitAchievementsView } from "./habit-achievements-view";
import { HabitLogsView } from "./habit-logs-view";
import { HabitEncouragementToast } from "./habit-encouragement-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function HabitSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-wrap items-center justify-between gap-4 rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3 transition-opacity"
          style={{ opacity: Math.max(0.35, 1 - i * 0.25) }}
        >
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-[4px] bg-[var(--app-hover)]" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32 rounded bg-[var(--app-hover)]" />
              <Skeleton className="h-2.5 w-20 rounded bg-[var(--app-hover)]/60" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 7 }).map((_, d) => (
              <Skeleton key={d} className="h-6 w-6 rounded-full bg-[var(--app-hover)]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface HabitViewProps {
  habits?: Habit[];
  habitSections?: HabitSection[];
  onToggleHabitCheck?: (params: { habitId: string; date: string }) => void;
  onAddHabit?: (params: any) => Promise<any>;
  onDeleteHabit?: (habitId: string) => Promise<any>;
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
  Footprints: <Footprints className="h-4 w-4" />,
  Sun: <Sun className="h-4 w-4" />,
  Moon: <Moon className="h-4 w-4" />,
  Activity: <Activity className="h-4 w-4" />,
};

const COLOR_PALETTE = [
  "#14b8a6", // Teal
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#6366f1", // Indigo
];

const PRESET_UNITS = ["glasses", "pages", "km", "mins", "cups", "steps", "reps"];

export function HabitView(props: HabitViewProps = {}) {
  const context = useContext(WorkspaceContext);
  const habits = props.habits ?? context?.habits ?? [];
  const habitSections = props.habitSections ?? context?.habitSections ?? [];
  const habitStatus = context?.habitStatus ?? "ACTIVE";
  const setHabitStatus = context?.setHabitStatus ?? (() => {});

  const onToggleHabitCheck =
    props.onToggleHabitCheck ?? context?.toggleHabitCheck ?? (() => {});
  const onAddHabit = props.onAddHabit ?? context?.addHabit ?? (async () => {});
  const onDeleteHabit = props.onDeleteHabit ?? context?.deleteHabit ?? (async () => {});
  const onUpdateHabit = context?.updateHabit ?? (async () => {});
  const onArchiveHabit = context?.archiveHabit ?? (async () => {});
  const onRestoreHabit = context?.restoreHabit ?? (async () => {});
  const onSkipHabitDay = context?.skipHabitDay ?? (async () => {});
  const onLogHabitValue = context?.logHabitValue ?? (async () => {});
  const onAddHabitSection = context?.addHabitSection ?? (async () => {});
  const onUpdateHabitSection = context?.updateHabitSection ?? (async () => {});
  const onDeleteHabitSection = context?.deleteHabitSection ?? (async () => {});

  const today = getTodayISO();
  const weekMonday = getMondayOfWeek(today);
  const weekDays = getWeekDays(weekMonday);
  const isInitialLoading =
    (context?.isInitialLoadingHabits ||
      (context?.isLoadingHabits && !context?.hasLoadedHabitsOnce)) &&
    habits.length === 0;

  const habitAnalytics = context?.habitAnalytics ?? null;
  const isLoadingHabitAnalytics = context?.isLoadingHabitAnalytics ?? false;
  const habitAnalyticsHabitId = context?.habitAnalyticsHabitId ?? "all";
  const setHabitAnalyticsHabitId = context?.setHabitAnalyticsHabitId ?? (() => {});

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const statusParam = searchParams.get("status");

  // View state synced with query parameters
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "ARCHIVED">(() =>
    statusParam === "archived" ? "ARCHIVED" : "ACTIVE"
  );
  const [viewMode, setViewMode] = useState<"ROUTINES" | "HEATMAP" | "ANALYTICS" | "ACHIEVEMENTS" | "JOURNAL">(() => {
    if (tabParam === "heatmap") return "HEATMAP";
    if (tabParam === "analytics") return "ANALYTICS";
    if (tabParam === "achievements") return "ACHIEVEMENTS";
    if (tabParam === "journal") return "JOURNAL";
    return "ROUTINES";
  });

  useEffect(() => {
    if (tabParam) {
      const upper = tabParam.toUpperCase();
      if (["ROUTINES", "HEATMAP", "ANALYTICS", "ACHIEVEMENTS", "JOURNAL"].includes(upper)) {
        setViewMode(upper as any);
      }
    }
  }, [tabParam]);

  useEffect(() => {
    if (statusParam) {
      const upper = statusParam.toUpperCase();
      if (upper === "ACTIVE" || upper === "ARCHIVED") {
        setActiveTab(upper as any);
        setHabitStatus(upper as any);
      }
    }
  }, [statusParam, setHabitStatus]);

  const handleViewModeChange = (mode: "ROUTINES" | "HEATMAP" | "ANALYTICS" | "ACHIEVEMENTS" | "JOURNAL") => {
    setViewMode(mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", mode.toLowerCase());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleTabChange = (tab: "ACTIVE" | "ARCHIVED") => {
    setActiveTab(tab);
    setHabitStatus(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", tab.toLowerCase());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Encouragement toast state
  const [toastData, setToastData] = useState<{
    habitTitle: string;
    streak: number;
    encouragement?: string | null;
    color?: string;
  } | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<{ id: string; title: string } | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<{ id: string; name: string } | null>(null);

  // Quick Numeric Value Log Modal
  const [numericLogHabit, setNumericLogHabit] = useState<{
    habit: Habit;
    date: string;
    currentValue: number;
    currentNote: string;
  } | null>(null);

  // Form states for Create/Edit
  const [title, setTitle] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Flame");
  const [selectedColor, setSelectedColor] = useState("#14b8a6");
  const [frequency, setFrequency] = useState("DAILY");
  const [targetDays, setTargetDays] = useState(7);
  const [goalType, setGoalType] = useState<"BOOLEAN" | "NUMERIC">("BOOLEAN");
  const [goalValue, setGoalValue] = useState<number>(8);
  const [goalUnit, setGoalUnit] = useState("glasses");
  const [sectionId, setSectionId] = useState<string>("");
  const [encouragement, setEncouragement] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");

  // New section form
  const [newSectionName, setNewSectionName] = useState("");

  const toggleSectionCollapse = (secId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  const handleCheckWithToast = ({ habitId, date }: { habitId: string; date: string }) => {
    const targetHabit = habits.find((h) => h.id === habitId);
    if (targetHabit) {
      const isAlreadyCompletedToday = targetHabit.isCompletedToday && date === today;
      if (!isAlreadyCompletedToday) {
        setToastData({
          habitTitle: targetHabit.title,
          streak: (targetHabit.streak || 0) + 1,
          encouragement: targetHabit.encouragement,
          color: targetHabit.color,
        });
      }
    }
    onToggleHabitCheck({ habitId, date });
  };

  const openCreateModal = (defaultSectionId?: string) => {
    setTitle("");
    setSelectedIcon("Flame");
    setSelectedColor("#14b8a6");
    setFrequency("DAILY");
    setTargetDays(7);
    setGoalType("BOOLEAN");
    setGoalValue(8);
    setGoalUnit("glasses");
    setSectionId(defaultSectionId || "");
    setEncouragement("");
    setReminderEnabled(false);
    setReminderTime("08:00");
    setEditingHabit(null);
    setShowAddModal(true);
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setTitle(habit.title);
    setSelectedIcon(habit.icon || "Flame");
    setSelectedColor(habit.color || "#14b8a6");
    setFrequency(habit.frequency || "DAILY");
    setTargetDays(habit.targetDays || 7);
    setGoalType(habit.goalType || "BOOLEAN");
    setGoalValue(habit.goalValue || 8);
    setGoalUnit(habit.goalUnit || "glasses");
    setSectionId(habit.sectionId || "");
    setEncouragement(habit.encouragement || "");
    setReminderEnabled(Boolean(habit.reminderEnabled));
    setReminderTime(habit.reminderTime || "08:00");
    setShowAddModal(true);
  };

  async function handleSaveHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingHabit) {
      await onUpdateHabit({
        id: editingHabit.id,
        title: title.trim(),
        icon: selectedIcon,
        color: selectedColor,
        frequency,
        targetDays: Number(targetDays) || 1,
        goalType,
        goalValue: goalType === "NUMERIC" ? Number(goalValue) : null,
        goalUnit: goalType === "NUMERIC" ? goalUnit.trim() : null,
        sectionId: sectionId ? sectionId : null,
        encouragement: encouragement.trim() || null,
        reminderTime: reminderEnabled ? reminderTime : null,
        reminderEnabled,
      });
    } else {
      await onAddHabit({
        title: title.trim(),
        icon: selectedIcon,
        color: selectedColor,
        frequency,
        targetDays: Number(targetDays) || 1,
        goalType,
        goalValue: goalType === "NUMERIC" ? Number(goalValue) : null,
        goalUnit: goalType === "NUMERIC" ? goalUnit.trim() : null,
        sectionId: sectionId ? sectionId : null,
        encouragement: encouragement.trim() || null,
        reminderTime: reminderEnabled ? reminderTime : null,
        reminderEnabled,
      });
    }

    setShowAddModal(false);
    setEditingHabit(null);
  }

  async function handleCreateSection(e: React.FormEvent) {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    await onAddHabitSection({ name: newSectionName.trim() });
    setNewSectionName("");
    setShowSectionModal(false);
  }

  // Calculate daily progress stats
  const activeHabits = habits.filter((h) => (h.status || "ACTIVE") === "ACTIVE");
  const completedTodayCount = activeHabits.filter((h) => {
    const todayLog = h.logs?.find((l) => l.date === today);
    if (!todayLog) return false;
    if (todayLog.status === "SKIPPED") return false;
    if (h.goalType === "NUMERIC" && h.goalValue) {
      return (todayLog.value ?? 0) >= h.goalValue || todayLog.completed;
    }
    return todayLog.completed;
  }).length;

  const totalActiveHabits = activeHabits.length;
  const progressPercent =
    totalActiveHabits > 0 ? (completedTodayCount / totalActiveHabits) * 100 : 0;

  // Group habits by section
  const { groupedHabits, unsectionedHabits } = useMemo(() => {
    const groups: { section: HabitSection; habits: Habit[] }[] = [];
    const unsectioned: Habit[] = [];

    const sectionMap = new Map<string, HabitSection>();
    habitSections.forEach((s) => sectionMap.set(s.id, s));

    const sectionBuckets = new Map<string, Habit[]>();
    habitSections.forEach((s) => sectionBuckets.set(s.id, []));

    habits.forEach((h) => {
      if (h.sectionId && sectionBuckets.has(h.sectionId)) {
        sectionBuckets.get(h.sectionId)!.push(h);
      } else {
        unsectioned.push(h);
      }
    });

    habitSections.forEach((sec) => {
      groups.push({
        section: sec,
        habits: sectionBuckets.get(sec.id) || [],
      });
    });

    return { groupedHabits: groups, unsectionedHabits: unsectioned };
  }, [habits, habitSections]);

  return (
    <div className="flex-1 flex flex-col rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-4 transition-colors sm:p-5 overflow-hidden">
      {/* Top Header Card: Title, Module Tabs, Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[var(--app-border)]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-semibold text-[var(--app-text)] tracking-tight">
              Habits
            </h2>

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-[6px] bg-[var(--app-panel)] p-0.5 border border-[var(--app-border)]">
              <button
                type="button"
                onClick={() => handleViewModeChange("ROUTINES")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "ROUTINES"
                    ? "bg-[var(--app-hover)] text-[var(--app-text)] font-semibold shadow-xs"
                    : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover)]/50"
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                <span>Routines</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange("HEATMAP")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "HEATMAP"
                    ? "bg-[var(--app-hover)] text-[var(--app-text)] font-semibold shadow-xs"
                    : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover)]/50"
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Heat Map</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange("ANALYTICS")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "ANALYTICS"
                    ? "bg-[var(--app-hover)] text-[var(--app-text)] font-semibold shadow-xs"
                    : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover)]/50"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Analytics</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange("ACHIEVEMENTS")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "ACHIEVEMENTS"
                    ? "bg-[var(--app-hover)] text-[var(--app-text)] font-semibold shadow-xs"
                    : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover)]/50"
                }`}
              >
                <Trophy className="h-3.5 w-3.5" />
                <span>Achievements</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange("JOURNAL")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "JOURNAL"
                    ? "bg-[var(--app-hover)] text-[var(--app-text)] font-semibold shadow-xs"
                    : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover)]/50"
                }`}
              >
                <StickyNote className="h-3.5 w-3.5" />
                <span>Journal</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-[var(--app-muted)]">
            {viewMode === "ROUTINES" && "Build enduring daily practices with custom metrics, sections, and streak protection."}
            {viewMode === "HEATMAP" && "365-day habit matrix visualizing continuous rhythm and intensity."}
            {viewMode === "ANALYTICS" && "Comprehensive cadence, weekday consistency, and cycle completion stats."}
            {viewMode === "ACHIEVEMENTS" && "Gamified mastery score, progression ranks, and milestone badges."}
            {viewMode === "JOURNAL" && "Chronological timeline of check-ins, logged values, and reflection memos."}
          </p>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5">
          {viewMode === "ROUTINES" ? (
            <>
              {/* Active / Archived sub-tabs */}
              <div className="flex items-center rounded-[6px] bg-[var(--app-panel)] p-0.5 border border-[var(--app-border)] mr-1">
                <button
                  type="button"
                  onClick={() => handleTabChange("ACTIVE")}
                  className={`px-2 py-0.5 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === "ACTIVE"
                      ? "bg-[var(--app-hover)] text-[var(--app-text)] font-semibold shadow-xs"
                      : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover)]/50"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("ARCHIVED")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === "ARCHIVED"
                      ? "bg-[var(--app-hover)] text-[var(--app-text)] font-semibold shadow-xs"
                      : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover)]/50"
                  }`}
                >
                  <Archive className="h-3 w-3" />
                  <span>Archived</span>
                </button>
              </div>

              {activeTab === "ACTIVE" && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowSectionModal(true)}
                    className="flex h-7 items-center gap-1 rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 text-xs font-medium text-[var(--app-text)] hover:bg-[var(--app-hover)] transition-colors cursor-pointer"
                    title="Create a new section to organize habits"
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">New Section</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openCreateModal()}
                    className="flex h-7 items-center gap-1 rounded-[4px] bg-[var(--app-accent)] hover:bg-[var(--app-accent)]/90 px-2.5 text-xs font-medium text-white transition-colors cursor-pointer shadow-none"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>New Habit</span>
                  </button>
                </>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => openCreateModal()}
              className="flex h-7 items-center gap-1 rounded-[4px] bg-[var(--app-accent)] hover:bg-[var(--app-accent)]/90 px-2.5 text-xs font-medium text-white transition-colors cursor-pointer shadow-none"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>New Habit</span>
            </button>
          )}
        </div>
      </div>

      {/* View: Routines */}
      {viewMode === "ROUTINES" && (
        <>
          {/* Today's Progress Bar (when viewing Active tab) */}
          {activeTab === "ACTIVE" && totalActiveHabits > 0 && (
            <div className="mb-6 rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--app-text)]">Today&apos;s Routines</span>
                  <span className="rounded-[3px] bg-[var(--app-accent-tag-bg)] px-2 py-0.5 text-[11px] font-mono font-medium text-[var(--app-accent)]">
                    {completedTodayCount} of {totalActiveHabits} completed
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-[var(--app-muted)]">
                  {Math.round(progressPercent)}%
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--app-panel-alt)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--app-accent)] to-sky-500 transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Main Habits Container */}
          <div className="flex-1 space-y-6 overflow-y-auto pr-1">
            {isInitialLoading ? (
              <HabitSkeleton count={4} />
            ) : habits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-[var(--app-muted)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-[var(--app-accent-tag-bg)] text-[var(--app-accent)] mb-3">
                  {activeTab === "ACTIVE" ? <Flame className="h-6 w-6" /> : <Archive className="h-6 w-6" />}
                </div>
                <h3 className="text-sm font-semibold text-[var(--app-text)]">
                  {activeTab === "ACTIVE" ? "No active habits created yet" : "No archived habits"}
                </h3>
                <p className="text-xs text-[var(--app-muted)] mt-1 max-w-sm">
                  {activeTab === "ACTIVE"
                    ? 'Click "New Habit" above to start tracking daily routines with check-ins or numeric targets.'
                    : "Habits you archive are preserved here with all past logs and streaks intact."}
                </p>
              </div>
            ) : (
              <>
                {/* 1. Grouped Sections */}
                {groupedHabits.map(({ section, habits: sectionHabits }) => {
                  const isCollapsed = collapsedSections[section.id];
                  return (
                    <div key={section.id} className="space-y-3">
                      {/* Section Header */}
                      <div className="flex items-center justify-between group/sec px-1">
                        <button
                          type="button"
                          onClick={() => toggleSectionCollapse(section.id)}
                          className="flex items-center gap-2 app-title font-semibold text-[var(--app-text)] hover:text-[var(--app-accent-text)] transition-colors"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4 text-[var(--app-muted)]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[var(--app-muted)]" />
                          )}
                          <span>{section.name}</span>
                          <span className="app-meta font-normal text-[var(--app-muted)] bg-[var(--app-panel-alt)] px-2 py-0.5 rounded-full border border-[var(--app-border)]/60">
                            {sectionHabits.length}
                          </span>
                        </button>

                        <div className="flex items-center gap-1 opacity-0 group-hover/sec:opacity-100 transition-opacity">
                          {activeTab === "ACTIVE" && (
                            <button
                              type="button"
                              onClick={() => openCreateModal(section.id)}
                              className="flex items-center gap-1 rounded-lg px-2 py-1 app-meta text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-panel-alt)]"
                              title="Add habit to this section"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSectionToDelete(section)}
                            className="rounded-lg p-1 text-[var(--app-muted)] hover:text-rose-500 hover:bg-[var(--app-panel-alt)]"
                            title="Delete section"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Section Habits List */}
                      {!isCollapsed && (
                        <div className="space-y-3 pl-1">
                          {sectionHabits.length === 0 ? (
                            <div className="rounded-[6px] border border-dashed border-[var(--app-border)] p-4 text-center text-xs text-[var(--app-muted)]">
                              No habits in this section.{" "}
                              <button
                                type="button"
                                onClick={() => openCreateModal(section.id)}
                                className="text-[var(--app-accent)] underline font-medium hover:underline cursor-pointer"
                              >
                                Add one now
                              </button>
                            </div>
                          ) : (
                            sectionHabits.map((habit) => (
                              <HabitRow
                                key={habit.id}
                                habit={habit}
                                today={today}
                                weekDays={weekDays}
                                activeTab={activeTab}
                                onToggleCheck={handleCheckWithToast}
                                onSkip={onSkipHabitDay}
                                onLogValue={(h, d, v, n) =>
                                  setNumericLogHabit({
                                    habit: h,
                                    date: d,
                                    currentValue: v,
                                    currentNote: n || "",
                                  })
                                }
                                onEdit={openEditModal}
                                onArchive={onArchiveHabit}
                                onRestore={onRestoreHabit}
                                onDelete={(h) => setHabitToDelete({ id: h.id, title: h.title })}
                                onViewStats={(h) => {
                                  setHabitAnalyticsHabitId(h.id);
                                  setViewMode("HEATMAP");
                                }}
                              />
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 2. Unsectioned Habits */}
                {unsectionedHabits.length > 0 && (
                  <div className="space-y-3">
                    {groupedHabits.length > 0 && (
                      <div className="flex items-center gap-2 px-1 pt-2">
                        <span className="app-overline font-semibold text-[var(--app-muted)]">
                          General
                        </span>
                        <span className="app-meta text-[var(--app-muted)]">
                          ({unsectionedHabits.length})
                        </span>
                      </div>
                    )}

                    <div className="space-y-3 pl-1">
                      {unsectionedHabits.map((habit) => (
                        <HabitRow
                          key={habit.id}
                          habit={habit}
                          today={today}
                          weekDays={weekDays}
                          activeTab={activeTab}
                          onToggleCheck={handleCheckWithToast}
                          onSkip={onSkipHabitDay}
                          onLogValue={(h, d, v, n) =>
                            setNumericLogHabit({
                              habit: h,
                              date: d,
                              currentValue: v,
                              currentNote: n || "",
                            })
                          }
                          onEdit={openEditModal}
                          onArchive={onArchiveHabit}
                          onRestore={onRestoreHabit}
                          onDelete={(h) => setHabitToDelete({ id: h.id, title: h.title })}
                          onViewStats={(h) => {
                            setHabitAnalyticsHabitId(h.id);
                            setViewMode("HEATMAP");
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* View: 365-Day Annual Heat Map */}
      {viewMode === "HEATMAP" && (
        <div className="flex-1 overflow-y-auto pr-1">
          <HabitHeatmapView
            analytics={habitAnalytics}
            habits={habits}
            selectedHabitId={habitAnalyticsHabitId}
            onSelectHabitId={setHabitAnalyticsHabitId}
            isLoading={isLoadingHabitAnalytics}
          />
        </div>
      )}

      {/* View: Analytics & Consistency Cycles */}
      {viewMode === "ANALYTICS" && (
        <div className="flex-1 overflow-y-auto pr-1">
          <HabitStatsView
            analytics={habitAnalytics}
            isLoading={isLoadingHabitAnalytics}
          />
        </div>
      )}

      {/* View: Gamified Achievements & Badges */}
      {viewMode === "ACHIEVEMENTS" && (
        <div className="flex-1 overflow-y-auto pr-1">
          <HabitAchievementsView
            analytics={habitAnalytics}
            isLoading={isLoadingHabitAnalytics}
          />
        </div>
      )}

      {/* View: Chronological Log Journal */}
      {viewMode === "JOURNAL" && (
        <div className="flex-1 overflow-y-auto pr-1">
          <HabitLogsView
            analytics={habitAnalytics}
            habits={habits}
            isLoading={isLoadingHabitAnalytics}
            onSelectHabit={(id) => {
              setHabitAnalyticsHabitId(id);
              setViewMode("HEATMAP");
            }}
          />
        </div>
      )}

      {/* ────────────────── MODALS ────────────────── */}

      {/* 1. Create / Edit Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-5 text-[var(--app-text)] shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-[var(--app-text)] mb-3">
              {editingHabit ? "Edit Habit" : "Create New Habit"}
            </h3>

            <form onSubmit={handleSaveHabit} className="space-y-3.5">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--app-muted)] uppercase tracking-wider mb-1">
                  Habit Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Read 20 pages, Drink Water, Morning Workout"
                  className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-3 py-1.5 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)]"
                />
              </div>

              {/* Goal Type Switcher (Boolean vs Numeric) */}
              <div>
                <label className="block app-overline font-semibold text-[var(--app-muted)] mb-1.5">
                  Goal Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGoalType("BOOLEAN")}
                    className={`flex items-center justify-center gap-2 rounded-[4px] p-2 border text-xs font-medium transition-colors ${
                      goalType === "BOOLEAN"
                        ? "border-[var(--app-accent)] bg-[var(--app-accent-tag-bg)] text-[var(--app-accent)]"
                        : "border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-panel-hover)]"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Yes / No Check-in</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGoalType("NUMERIC")}
                    className={`flex items-center justify-center gap-2 rounded-[4px] p-2 border text-xs font-medium transition-colors ${
                      goalType === "NUMERIC"
                        ? "border-[var(--app-accent)] bg-[var(--app-accent-tag-bg)] text-[var(--app-accent)]"
                        : "border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-panel-hover)]"
                    }`}
                  >
                    <Target className="h-3.5 w-3.5" />
                    <span>Numeric Target</span>
                  </button>
                </div>
              </div>

              {/* Numeric Goal Target and Unit */}
              {goalType === "NUMERIC" && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel-hover)]">
                  <div>
                    <label className="block app-overline font-semibold text-[var(--app-muted)] mb-1">
                      Target Amount
                    </label>
                    <input
                      type="number"
                      min={1}
                      step="any"
                      required
                      value={goalValue}
                      onChange={(e) => setGoalValue(Number(e.target.value))}
                      className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-panel-alt)] px-3 py-1.5 app-label text-white focus:outline-none focus:border-[var(--app-accent)]"
                    />
                  </div>

                  <div>
                    <label className="block app-overline font-semibold text-[var(--app-muted)] mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      required
                      value={goalUnit}
                      onChange={(e) => setGoalUnit(e.target.value)}
                      placeholder="glasses, km, pages"
                      className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-panel-alt)] px-3 py-1.5 app-label text-white focus:outline-none focus:border-[var(--app-accent)]"
                    />
                  </div>

                  {/* Preset unit tags */}
                  <div className="col-span-2 flex flex-wrap gap-1.5 pt-1">
                    {PRESET_UNITS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setGoalUnit(u)}
                        className={`rounded-md px-2 py-0.5 app-meta transition-colors ${
                          goalUnit === u
                            ? "bg-[var(--app-accent)] text-white"
                            : "bg-[var(--app-panel-alt)] text-[var(--app-muted)] hover:text-white"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Assignment */}
              <div>
                <label className="block app-overline font-semibold text-[var(--app-muted)] mb-1">
                  Section / Group
                </label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1.5 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)]"
                >
                  <option value="">No Section (General)</option>
                  {habitSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Frequency */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--app-muted)] uppercase tracking-wider mb-1">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1.5 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)]"
                  >
                    <option value="DAILY">Every Day</option>
                    <option value="WEEKLY">Weekly Target</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--app-muted)] uppercase tracking-wider mb-1">
                    Days / Week
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={targetDays}
                    onChange={(e) => setTargetDays(Number(e.target.value))}
                    className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1.5 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] font-mono"
                  />
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block app-overline font-semibold text-[var(--app-muted)] mb-1.5">
                  Select Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(ICON_MAP).map((iconKey) => (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setSelectedIcon(iconKey)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                        selectedIcon === iconKey
                          ? "border-[var(--app-accent)] bg-[var(--app-accent)]/20 text-[var(--app-accent-text)] scale-105"
                          : "border-[var(--app-border)] bg-[var(--app-panel-alt)]/80 text-[var(--app-muted)] hover:text-white"
                      }`}
                    >
                      {ICON_MAP[iconKey]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme */}
              <div>
                <label className="block app-overline font-semibold text-[var(--app-muted)] mb-1.5">
                  Color Theme
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`h-6 w-6 rounded-full transition-transform ${
                        selectedColor === c
                          ? "scale-115 ring-2 ring-[var(--app-accent)] ring-offset-2 ring-offset-[var(--app-rail)]"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Encouragement message */}
              <div>
                <label className="block app-overline font-semibold text-[var(--app-muted)] mb-1">
                  Encouragement / Reflection Note (Optional)
                </label>
                <input
                  type="text"
                  value={encouragement}
                  onChange={(e) => setEncouragement(e.target.value)}
                  placeholder="e.g. Small steps every day create massive growth"
                  className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1.5 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)]"
                />
              </div>

              {/* Daily Reminder Time */}
              <div className="rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel-hover)] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[var(--app-accent)]" />
                    <div>
                      <label htmlFor="habitReminderToggle" className="text-xs font-semibold text-[var(--app-text)] block cursor-pointer">
                        Daily Reminder
                      </label>
                      <span className="text-[11px] text-[var(--app-muted)]">
                        Prompt at your chosen routine time
                      </span>
                    </div>
                  </div>
                  <input
                    id="habitReminderToggle"
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="h-4 w-4 rounded-[3px] border-[var(--app-border)] accent-[var(--app-accent)] cursor-pointer"
                  />
                </div>

                {reminderEnabled && (
                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--app-border)]">
                    <Clock className="h-3.5 w-3.5 text-[var(--app-muted)]" />
                    <span className="text-xs text-[var(--app-muted)]">Remind at:</span>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2 py-1 text-xs text-[var(--app-text)] font-mono focus:outline-none focus:border-[var(--app-accent)]"
                    />
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--app-border)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-[4px] px-3 py-1.5 text-xs text-[var(--app-muted)] hover:bg-[var(--app-panel-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[4px] bg-[var(--app-accent)] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[var(--app-accent-hover)] transition-colors shadow-xs"
                >
                  {editingHabit ? "Save Changes" : "Create Habit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Create Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-5 text-[var(--app-text)] shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-semibold text-[var(--app-text)] mb-1">Create Section</h3>
            <p className="text-xs text-[var(--app-muted)] mb-3">
              Organize your habits into focused groups like &quot;Morning Routine&quot; or &quot;Evening Wind-down&quot;.
            </p>

            <form onSubmit={handleCreateSection} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--app-muted)] uppercase tracking-wider mb-1">
                  Section Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="e.g. Morning Routine, Fitness, Night"
                  className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1.5 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--app-border)]">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="rounded-[4px] px-3 py-1.5 text-xs text-[var(--app-muted)] hover:bg-[var(--app-panel-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[4px] bg-[var(--app-accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--app-accent-hover)] transition-colors shadow-sm"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Numeric Log Value Modal */}
      {numericLogHabit && (
        <NumericValueModal
          habit={numericLogHabit.habit}
          date={numericLogHabit.date}
          initialValue={numericLogHabit.currentValue}
          initialNote={numericLogHabit.currentNote}
          onClose={() => setNumericLogHabit(null)}
          onSave={async (val, note) => {
            const h = numericLogHabit.habit;
            const reachedTarget = (h.goalValue || 1) <= val;
            if (reachedTarget && !h.isCompletedToday && numericLogHabit.date === today) {
              setToastData({
                habitTitle: h.title,
                streak: (h.streak || 0) + 1,
                encouragement: h.encouragement,
                color: h.color,
              });
            }
            await onLogHabitValue({
              habitId: numericLogHabit.habit.id,
              date: numericLogHabit.date,
              value: val,
              note,
            });
            setNumericLogHabit(null);
          }}
        />
      )}

      {/* 4. Delete Habit Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!habitToDelete}
        onOpenChange={(open) => !open && setHabitToDelete(null)}
        title="Delete Habit"
        description={`Are you sure you want to delete "${habitToDelete?.title}"? All streak history and logs for this habit will be permanently deleted. (Tip: You can Archive it instead to preserve your streak history.)`}
        onConfirm={async () => {
          if (habitToDelete) {
            await onDeleteHabit(habitToDelete.id);
            setHabitToDelete(null);
          }
        }}
      />

      {/* 5. Delete Section Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!sectionToDelete}
        onOpenChange={(open) => !open && setSectionToDelete(null)}
        title="Delete Section"
        description={`Are you sure you want to delete section "${sectionToDelete?.name}"? The habits inside it will be moved to General, not deleted.`}
        onConfirm={async () => {
          if (sectionToDelete) {
            await onDeleteHabitSection(sectionToDelete.id);
            setSectionToDelete(null);
          }
        }}
      />

      {/* 6. Habit Encouragement Celebration Toast */}
      {toastData && (
        <HabitEncouragementToast
          habitTitle={toastData.habitTitle}
          streak={toastData.streak}
          encouragement={toastData.encouragement}
          color={toastData.color}
          onDismiss={() => setToastData(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-component: Habit Row Card
// ─────────────────────────────────────────────────────────────

interface HabitRowProps {
  habit: Habit;
  today: string;
  weekDays: { iso: string; shortName: string; dayNum: number }[];
  activeTab: "ACTIVE" | "ARCHIVED";
  onToggleCheck: (params: { habitId: string; date: string }) => void;
  onSkip: (params: { habitId: string; date: string; note?: string }) => void;
  onLogValue: (habit: Habit, date: string, currentVal: number, currentNote?: string | null) => void;
  onEdit: (habit: Habit) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (habit: Habit) => void;
  onViewStats?: (habit: Habit) => void;
}

function HabitRow({
  habit,
  today,
  weekDays,
  activeTab,
  onToggleCheck,
  onSkip,
  onLogValue,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onViewStats,
}: HabitRowProps) {
  const todayLog = habit.logs?.find((l) => l.date === today);
  const isCompletedToday = habit.isCompletedToday;
  const isSkippedToday = todayLog?.status === "SKIPPED";
  const isNumeric = habit.goalType === "NUMERIC";
  const targetVal = habit.goalValue || 1;
  const currentVal = todayLog?.value ?? (isCompletedToday ? targetVal : 0);
  const numericProgressPct = Math.min(100, Math.round((currentVal / targetVal) * 100));

  return (
    <div className="group relative flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3 transition-colors hover:bg-[var(--app-hover)]/20">
      {/* Left: Icon, Title, Goal details & Streak */}
      <div className="flex items-center gap-2.5 min-w-[200px] sm:min-w-[240px] flex-1">
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[4px] font-medium text-white shadow-xs"
          style={{ backgroundColor: habit.color || "#2383e2" }}
        >
          {ICON_MAP[habit.icon] || <Flame className="h-3.5 w-3.5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-[var(--app-text)] truncate">
              {habit.title}
            </h4>

            {isSkippedToday && (
              <span className="rounded-[3px] bg-amber-500/15 text-amber-500 text-[10px] font-medium px-1.5 py-0.2">
                Skipped Today
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <span className="flex items-center gap-0.5 app-meta font-bold text-amber-500">
              <Flame className="h-3 w-3 fill-current" />
              {habit.streak} day streak
            </span>

            <span className="app-meta text-[var(--app-muted)]">•</span>

            <span className="app-meta text-[var(--app-muted)]">
              {habit.frequency === "DAILY" ? "Daily" : `${habit.targetDays}x/week`}
            </span>

            {isNumeric && (
              <>
                <span className="app-meta text-[var(--app-muted)]">•</span>
                <span className="app-meta font-semibold text-[var(--app-accent-text)]">
                  Target: {habit.goalValue} {habit.goalUnit || "units"}
                </span>
              </>
            )}

            {habit.completedCycles && habit.completedCycles > 0 ? (
              <>
                <span className="app-meta text-[var(--app-muted)]">•</span>
                <span className="app-meta text-[var(--app-muted)] flex items-center gap-0.5">
                  <Trophy className="h-2.5 w-2.5" />
                  {habit.completedCycles} cycles
                </span>
              </>
            ) : null}
          </div>

          {habit.encouragement && (
            <p className="app-meta italic text-[var(--app-muted)]/80 mt-1 line-clamp-1">
              &ldquo;{habit.encouragement}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Middle/Right: Numeric Goal Progress OR 7-Day Week Check-ins */}
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end overflow-x-auto py-1 px-1">
        {isNumeric ? (
          <div className="flex items-center gap-2">
            {/* Numeric Progress Capsule */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5">
                <span className="app-label font-bold text-[var(--app-text)]">
                  {currentVal} / {targetVal} {habit.goalUnit || ""}
                </span>
                <span className="app-meta font-medium text-[var(--app-muted)]">
                  ({numericProgressPct}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[var(--app-panel-alt)] border border-[var(--app-border)]/50">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${numericProgressPct}%`,
                    backgroundColor: habit.color || "var(--app-accent)",
                  }}
                />
              </div>
            </div>

            {/* Smart Tap Quick +1 Button */}
            <button
              type="button"
              onClick={() => {
                const nextVal = currentVal + 1;
                onLogValue(habit, today, nextVal, todayLog?.note);
              }}
              title="Quick +1 increment"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-panel-alt)] text-[var(--app-text)] hover:border-[var(--app-accent)] active:scale-90 transition-all font-bold app-label"
            >
              +1
            </button>

            {/* Tap to edit exact quantity & add note */}
            <button
              type="button"
              onClick={() => onLogValue(habit, today, currentVal, todayLog?.note)}
              title="Set exact amount or add note"
              className="flex h-8 items-center gap-1 px-2.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-panel-alt)] text-[var(--app-muted)] hover:text-white hover:border-[var(--app-accent)] transition-all app-meta font-medium"
            >
              <Pencil className="h-3 w-3" />
              <span>Log</span>
            </button>
          </div>
        ) : (
          /* Boolean Habit: 7-Day week check-in circles (Mon-Sun) */
          <div className="flex items-center gap-1.5 py-1 px-0.5">
            {weekDays.map((day) => {
              const log = habit.logs?.find((l) => l.date === day.iso);
              const isChecked = log?.completed || log?.status === "COMPLETED";
              const isSkipped = log?.status === "SKIPPED";
              const isToday = day.iso === today;

              return (
                <div key={day.iso} className="flex flex-col items-center gap-1">
                  <span className="app-overline font-semibold text-[var(--app-muted)] app-meta">
                    {day.shortName[0]}
                  </span>
                  <div className="p-0.5">
                    <button
                      type="button"
                      onClick={() => onToggleCheck({ habitId: habit.id, date: day.iso })}
                      title={`${day.shortName} (${day.iso}) - ${
                        isSkipped
                          ? "Skipped (Streak protected)"
                          : isChecked
                          ? "Completed - click to toggle"
                          : "Not checked - click to check in"
                      }`}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all active:scale-90 ${
                        isChecked
                          ? "border-transparent text-white shadow-xs font-bold"
                          : isSkipped
                          ? "border-amber-500/50 bg-amber-500/10 text-amber-500"
                          : "border-[var(--app-border)] bg-[var(--app-panel-alt)] hover:border-[var(--app-border)] dark:border-[var(--app-border)]"
                      } ${isToday ? "ring-2 ring-[var(--app-accent)] ring-offset-2 ring-offset-[var(--app-panel)]" : ""}`}
                      style={{
                        backgroundColor: isChecked ? habit.color || "var(--app-accent)" : undefined,
                      }}
                    >
                      {isChecked ? (
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      ) : isSkipped ? (
                        <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
                      ) : null}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Controls: Quick Heat Map, Skip today, Context Menu */}
        <div className="flex items-center gap-1 pl-1 border-l border-[var(--app-border)]/60">
          <button
            type="button"
            onClick={() => onViewStats?.(habit)}
            title="View 365-day Heat Map & Trends"
            className="rounded-[4px] p-1.5 text-[var(--app-muted)] hover:text-[var(--app-accent-text)] hover:bg-[var(--app-hover)] transition-colors cursor-pointer"
          >
            <CalendarDays className="h-3.5 w-3.5" />
          </button>

          {activeTab === "ACTIVE" && !isCompletedToday && !isSkippedToday && (
            <button
              type="button"
              onClick={() => onSkip({ habitId: habit.id, date: today })}
              title="Skip today without breaking streak"
              className="rounded-[4px] p-1.5 text-[var(--app-muted)] hover:text-amber-500 hover:bg-[var(--app-hover)] transition-colors cursor-pointer"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Three-dots Dropdown Menu via Portal to prevent any overflow clipping */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  title="More actions"
                  className="rounded-[4px] p-1.5 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover)] transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              }
            />
            <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="w-48">
              <DropdownMenuItem onClick={() => onViewStats?.(habit)}>
                <BarChart3 className="h-3.5 w-3.5 text-[var(--app-accent-text)]" />
                <span>Heat Map & Trends</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onEdit(habit)}>
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit Habit</span>
              </DropdownMenuItem>

              {activeTab === "ACTIVE" ? (
                <>
                  <DropdownMenuItem onClick={() => onSkip({ habitId: habit.id, date: today })}>
                    <SkipForward className="h-3.5 w-3.5 text-amber-500" />
                    <span>Skip Today</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => onArchive(habit.id)}>
                    <Archive className="h-3.5 w-3.5" />
                    <span>Archive</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => onRestore(habit.id)}>
                  <ArchiveRestore className="h-3.5 w-3.5 text-[var(--app-accent-text)]" />
                  <span>Restore Habit</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(habit)}
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-component: Numeric Log Modal (smart tap / stepper / memo)
// ─────────────────────────────────────────────────────────────

interface NumericValueModalProps {
  habit: Habit;
  date: string;
  initialValue: number;
  initialNote: string;
  onClose: () => void;
  onSave: (val: number, note?: string) => Promise<void>;
}

function NumericValueModal({
  habit,
  date,
  initialValue,
  initialNote,
  onClose,
  onSave,
}: NumericValueModalProps) {
  const [val, setVal] = useState<number>(initialValue);
  const [note, setNote] = useState<string>(initialNote);
  const targetVal = habit.goalValue || 1;

  const handleQuickAdd = (delta: number) => {
    setVal((prev) => Math.max(0, Number((prev + delta).toFixed(2))));
  };

  const handleMarkGoalMet = () => {
    setVal(targetVal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-5 text-[var(--app-text)] shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-[4px] text-white"
            style={{ backgroundColor: habit.color || "var(--app-accent)" }}
          >
            {ICON_MAP[habit.icon] || <Target className="h-3.5 w-3.5" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--app-text)]">{habit.title}</h3>
            <p className="text-xs text-[var(--app-muted)]">
              Target: {targetVal} {habit.goalUnit || "units"} for {date}
            </p>
          </div>
        </div>

        {/* Stepper Controls */}
        <div className="my-3 rounded-[6px] border border-[var(--app-border)] bg-[var(--app-hover)]/40 p-3.5 flex flex-col items-center gap-2">
          <span className="text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider">
            RECORDED TODAY
          </span>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleQuickAdd(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-text)] hover:bg-[var(--app-panel-hover)] active:scale-95 transition-all cursor-pointer"
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="flex items-baseline gap-1.5">
              <input
                type="number"
                min={0}
                step="any"
                value={val}
                onChange={(e) => setVal(Math.max(0, Number(e.target.value)))}
                className="w-20 text-center rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] py-1.5 text-xl font-bold font-mono text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)]"
              />
              <span className="text-xs text-[var(--app-muted)]">{habit.goalUnit || ""}</span>
            </div>

            <button
              type="button"
              onClick={() => handleQuickAdd(1)}
              className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-text)] hover:bg-[var(--app-panel-hover)] active:scale-95 transition-all font-bold text-base cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickAdd(2)}
              className="rounded-[4px] bg-[var(--app-panel)] px-2.5 py-1 text-xs text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-panel-hover)] border border-[var(--app-border)] cursor-pointer"
            >
              +2
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(5)}
              className="rounded-[4px] bg-[var(--app-panel)] px-2.5 py-1 text-xs text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-panel-hover)] border border-[var(--app-border)] cursor-pointer"
            >
              +5
            </button>
            <button
              type="button"
              onClick={handleMarkGoalMet}
              className="rounded-[3px] bg-[var(--app-accent-tag-bg)] px-2 py-0.5 text-xs font-mono font-medium text-[var(--app-accent)] border border-[var(--app-accent)]/20 cursor-pointer"
            >
              Full Target ({targetVal})
            </button>
          </div>
        </div>

        {/* Optional reflection memo/note */}
        <div className="mb-4">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--app-muted)] uppercase tracking-wider mb-1">
            <StickyNote className="h-3 w-3" />
            <span>Reflection Memo</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Completed during lunch walk"
            className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1.5 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)]"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--app-border)]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[4px] px-3 py-1.5 text-xs text-[var(--app-muted)] hover:bg-[var(--app-panel-hover)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(val, note)}
            className="rounded-[4px] bg-[var(--app-accent)] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[var(--app-accent-hover)] transition-colors shadow-xs"
          >
            Save Log
          </button>
        </div>
      </div>
    </div>
  );
}
