"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { TickTickModule } from "@/components/ticktick/module-rail";
import {
  useTickTick,
  Task,
  TaskList,
  Tag,
  Habit,
  Countdown,
  StatisticsData,
  UserSettings,
  TaskReminder,
  ListMember,
  CalendarSubscription,
  PomodoroStats,
} from "@/hooks/use-ticktick";

export interface TickTickContextType {
  // Navigation & View State
  activeModule: TickTickModule;
  setActiveModule: (mod: TickTickModule) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  activeListId: string | null;
  setActiveListId: (id: string | null) => void;
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;
  activeFilterId: string | null;
  setActiveFilterId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statsRange: "week" | "month" | "quarter" | "year";
  setStatsRange: (range: "week" | "month" | "quarter" | "year") => void;
  taskLayout: "list" | "kanban";
  setTaskLayout: (layout: "list" | "kanban") => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  selectedTask: Task | null;
  currentListName: string;

  // View Navigation Helpers
  selectView: (view: string, listId?: string | null, tag?: string | null) => void;
  selectFilter: (filterId: string) => void;
  selectModule: (mod: TickTickModule) => void;

  // Modals State
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isFilterPanelOpen: boolean;
  setIsFilterPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isThemePickerOpen: boolean;
  setIsThemePickerOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Background Fetching & Sync State
  isBackgroundFetching: boolean;
  refetchAll: () => Promise<void>;

  // Domain Queries & States
  tasks: Task[];
  isLoadingTasks: boolean;
  lists: TaskList[];
  inboxCount: number;
  todayCount: number;
  tomorrowCount: number;
  allCount: number;
  tags: Tag[];
  pomodoroStats: PomodoroStats;
  habits: Habit[];
  isLoadingHabits: boolean;
  filters: any[];
  countdowns: Countdown[];
  stats: StatisticsData | null;
  isLoadingStats: boolean;
  settings: UserSettings | null;
  reminders: TaskReminder[];
  members: ListMember[];
  assignees: ListMember[];
  subscriptions: CalendarSubscription[];

  // Mutations
  toggleComplete: (params: { taskId: string; completed: boolean }) => void;
  addTask: (newTask: any) => Promise<any>;
  updateTask: (updates: { taskId: string } & Partial<Task>) => void;
  deleteTask: (params: { taskId: string; permanent?: boolean }) => Promise<any>;
  batchAction: (params: {
    taskIds: string[];
    action: "complete" | "delete" | "priority" | "dueDate" | "moveList";
    value?: any;
  }) => Promise<any>;
  addList: (params: { name: string; color: string; icon?: string }) => Promise<any>;
  updateList: (params: { id: string; name?: string; color?: string; icon?: string }) => Promise<any>;
  deleteList: (id: string) => Promise<any>;
  addTag: (params: { name: string; color?: string }) => Promise<any>;
  deleteTag: (id: string) => Promise<any>;
  logPomodoro: (params: { taskId?: string; durationMinutes: number }) => Promise<any>;
  addHabit: (newHabit: {
    title: string;
    icon?: string;
    color?: string;
    frequency?: string;
    targetDays?: number;
  }) => Promise<any>;
  toggleHabitCheck: (params: { habitId: string; date: string }) => void;
  deleteHabit: (habitId: string) => Promise<any>;
  createFilter: (input: { name: string; icon?: string; color?: string; query?: any }) => Promise<any>;
  updateFilter: (params: {
    id: string;
  } & Partial<{ name: string; icon: string; color: string; query: any }>) => Promise<any>;
  deleteFilter: (id: string) => Promise<any>;
  addCountdown: (input: {
    title: string;
    targetDate: string;
    color?: string;
    emoji?: string;
    repeat?: string;
  }) => Promise<any>;
  updateCountdown: (params: { id: string } & Partial<Countdown>) => Promise<any>;
  deleteCountdown: (id: string) => Promise<any>;
  updateSettings: (updates: { themeId?: string; timezone?: string }) => Promise<any>;
  addReminder: (input: {
    taskId: string;
    type: string;
    remindAt?: string;
    minutesBefore?: number;
  }) => Promise<any>;
  updateReminder: (params: { id: string } & Partial<TaskReminder>) => Promise<any>;
  deleteReminder: (id: string) => Promise<any>;
  inviteMember: (input: {
    listId: string;
    email: string;
    displayName?: string;
    role?: string;
  }) => Promise<any>;
  updateMember: (params: {
    memberId: string;
  } & Partial<{ role: string; status: string; displayName: string }>) => Promise<any>;
  removeMember: (memberId: string) => Promise<any>;
  setAssignees: (params: { taskId: string; memberIds: string[] }) => Promise<any>;
  addSubscription: (input: {
    name: string;
    url: string;
    color?: string;
    listId?: string | null;
  }) => Promise<any>;
  deleteSubscription: (id: string) => Promise<any>;
  syncSubscription: (id: string) => Promise<any>;
}

export const TickTickContext = createContext<TickTickContextType | null>(null);

export function TickTickProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const fetchingCount = useIsFetching();
  const isBackgroundFetching = fetchingCount > 0;

  // Navigation State
  const [activeModule, setActiveModule] = useState<TickTickModule>("tasks");
  const [activeView, setActiveView] = useState<string>("today");
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statsRange, setStatsRange] = useState<"week" | "month" | "quarter" | "year">("month");
  const [taskLayout, setTaskLayout] = useState<"list" | "kanban">("list");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Modals State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  // TanStack Query Hook integration
  const ticktick = useTickTick({
    view:
      activeModule === "timeline" || activeModule === "calendar"
        ? activeModule
        : activeView,
    listId: activeModule === "calendar" ? undefined : activeListId,
    tag: activeModule === "calendar" ? undefined : activeTag,
    search: searchQuery,
    filterId: activeFilterId,
    statsRange,
    remindersTaskId: selectedTaskId,
    assigneesTaskId: selectedTaskId,
  });

  // Calculate current list/view name
  const currentListName = useMemo(() => {
    if (activeListId) {
      const l = ticktick.lists.find((item) => item.id === activeListId);
      return l ? l.name : "List";
    }
    if (activeTag) {
      return `#${activeTag}`;
    }
    switch (activeView) {
      case "all":
        return "All Tasks";
      case "today":
        return "Today";
      case "tomorrow":
        return "Tomorrow";
      case "next7":
        return "Next 7 Days";
      case "inbox":
        return "Inbox";
      case "completed":
        return "Completed";
      case "trash":
        return "Trash";
      default:
        return "Tasks";
    }
  }, [activeListId, activeTag, activeView, ticktick.lists]);

  // Selected Task
  const selectedTask = useMemo(
    () => ticktick.tasks.find((t) => t.id === selectedTaskId) || null,
    [ticktick.tasks, selectedTaskId]
  );

  // Global keydown listener for Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Helper navigation methods
  const selectView = (view: string, listId?: string | null, tag?: string | null) => {
    setActiveView(view);
    setActiveListId(listId || null);
    setActiveTag(tag || null);
    setActiveFilterId(null);
    setSelectedTaskId(null);
  };

  const selectFilter = (filterId: string) => {
    setActiveFilterId(filterId);
    setActiveListId(null);
    setActiveTag(null);
    setActiveModule("tasks");
    setSelectedTaskId(null);
  };

  const selectModule = (mod: TickTickModule) => {
    setActiveModule(mod);
    setSelectedTaskId(null);
  };

  const refetchAll = async () => {
    await queryClient.invalidateQueries();
  };

  const contextValue: TickTickContextType = {
    activeModule,
    setActiveModule,
    activeView,
    setActiveView,
    activeListId,
    setActiveListId,
    activeTag,
    setActiveTag,
    activeFilterId,
    setActiveFilterId,
    searchQuery,
    setSearchQuery,
    statsRange,
    setStatsRange,
    taskLayout,
    setTaskLayout,
    selectedTaskId,
    setSelectedTaskId,
    selectedTask,
    currentListName,

    selectView,
    selectFilter,
    selectModule,

    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isQuickAddOpen,
    setIsQuickAddOpen,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    isThemePickerOpen,
    setIsThemePickerOpen,

    isBackgroundFetching,
    refetchAll,

    // Data from useTickTick
    tasks: ticktick.tasks,
    isLoadingTasks: ticktick.isLoadingTasks,
    lists: ticktick.lists,
    inboxCount: ticktick.inboxCount,
    todayCount: ticktick.todayCount,
    tomorrowCount: ticktick.tomorrowCount,
    allCount: ticktick.allCount,
    tags: ticktick.tags,
    pomodoroStats: ticktick.pomodoroStats,
    habits: ticktick.habits,
    isLoadingHabits: ticktick.isLoadingHabits,
    filters: ticktick.filters,
    countdowns: ticktick.countdowns,
    stats: ticktick.stats,
    isLoadingStats: ticktick.isLoadingStats,
    settings: ticktick.settings,
    reminders: ticktick.reminders,
    members: ticktick.members,
    assignees: ticktick.assignees,
    subscriptions: ticktick.subscriptions,

    // Mutations from useTickTick
    toggleComplete: ticktick.toggleComplete,
    addTask: ticktick.addTask,
    updateTask: ticktick.updateTask,
    deleteTask: ticktick.deleteTask,
    batchAction: ticktick.batchAction,
    addList: ticktick.addList,
    updateList: ticktick.updateList,
    deleteList: ticktick.deleteList,
    addTag: ticktick.addTag,
    deleteTag: ticktick.deleteTag,
    logPomodoro: ticktick.logPomodoro,
    addHabit: ticktick.addHabit,
    toggleHabitCheck: ticktick.toggleHabitCheck,
    deleteHabit: ticktick.deleteHabit,
    createFilter: ticktick.createFilter,
    updateFilter: ticktick.updateFilter,
    deleteFilter: ticktick.deleteFilter,
    addCountdown: ticktick.addCountdown,
    updateCountdown: ticktick.updateCountdown,
    deleteCountdown: ticktick.deleteCountdown,
    updateSettings: ticktick.updateSettings,
    addReminder: ticktick.addReminder,
    updateReminder: ticktick.updateReminder,
    deleteReminder: ticktick.deleteReminder,
    inviteMember: ticktick.inviteMember,
    updateMember: ticktick.updateMember,
    removeMember: ticktick.removeMember,
    setAssignees: ticktick.setAssignees,
    addSubscription: ticktick.addSubscription,
    deleteSubscription: ticktick.deleteSubscription,
    syncSubscription: ticktick.syncSubscription,
  };

  return (
    <TickTickContext.Provider value={contextValue}>
      {children}
    </TickTickContext.Provider>
  );
}

export function useTickTickContext() {
  const context = useContext(TickTickContext);
  if (!context) {
    throw new Error("useTickTickContext must be used within a TickTickProvider");
  }
  return context;
}
