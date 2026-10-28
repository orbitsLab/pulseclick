"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { WorkspaceModule } from "@/components/workspace/module-rail";
import { getTodayISO, addDays } from "@/lib/date-utils";
import {
  useWorkspace,
  Task,
  TaskList,
  Tag,
  Habit,
  HabitSection,
  HabitAnalyticsData,
  Countdown,
  StatisticsData,
  UserSettings,
  TaskReminder,
  ListMember,
  CalendarSubscription,
  PomodoroStats,
} from "@/hooks/use-workspace";

export interface WorkspaceContextType {
  // Navigation & View State
  activeModule: WorkspaceModule;
  setActiveModule: (mod: WorkspaceModule) => void;
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
  currentList?: TaskList | null;

  // Calendar State
  calView?: "month" | "week" | "day" | "agenda" | "year";
  setCalView?: (view: "month" | "week" | "day" | "agenda" | "year") => void;
  calDate?: Date;
  setCalDate?: (date: Date) => void;

  // Sidebar State
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;

  // View Navigation Helpers
  selectView: (view: string, listId?: string | null, tag?: string | null) => void;
  selectFilter: (filterId: string) => void;
  selectModule: (mod: WorkspaceModule) => void;

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
  allActiveTasks: Task[];
  tasks: Task[];
  isLoadingTasks: boolean;
  isInitialLoadingTasks: boolean;
  hasLoadedTasksOnce: boolean;
  isErrorTasks?: boolean;
  tasksError?: Error | null;
  refetchTasks?: () => Promise<any>;
  lists: TaskList[];
  isLoadingLists: boolean;
  isInitialLoadingLists: boolean;
  hasLoadedListsOnce: boolean;
  isErrorLists?: boolean;
  listsError?: Error | null;
  refetchLists?: () => Promise<any>;
  inboxCount: number;
  todayCount: number;
  tomorrowCount: number;
  allCount: number;
  tags: Tag[];
  isLoadingTags: boolean;
  isInitialLoadingTags: boolean;
  hasLoadedTagsOnce: boolean;
  pomodoroStats: PomodoroStats;
  habits: Habit[];
  isLoadingHabits: boolean;
  isInitialLoadingHabits: boolean;
  hasLoadedHabitsOnce: boolean;
  habitSections: HabitSection[];
  isLoadingHabitSections: boolean;
  habitStatus: "ACTIVE" | "ARCHIVED" | "ALL";
  setHabitStatus: (status: "ACTIVE" | "ARCHIVED" | "ALL") => void;
  habitAnalytics: HabitAnalyticsData | null;
  isLoadingHabitAnalytics: boolean;
  habitAnalyticsHabitId: string;
  setHabitAnalyticsHabitId: (id: string) => void;
  filters: any[];
  isLoadingFilters: boolean;
  isInitialLoadingFilters: boolean;
  hasLoadedFiltersOnce: boolean;
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
  addList: (params: { name: string; color: string; icon?: string; background?: string }) => Promise<any>;
  updateList: (params: { id: string; name?: string; color?: string; icon?: string; background?: string }) => Promise<any>;
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
    goalType?: "BOOLEAN" | "NUMERIC";
    goalValue?: number | null;
    goalUnit?: string | null;
    sectionId?: string | null;
    encouragement?: string | null;
    reminderTime?: string | null;
    reminderEnabled?: boolean;
  }) => Promise<any>;
  updateHabit: (params: { id: string } & Partial<Habit>) => Promise<any>;
  archiveHabit: (habitId: string) => Promise<any>;
  restoreHabit: (habitId: string) => Promise<any>;
  skipHabitDay: (params: { habitId: string; date: string; note?: string }) => Promise<any>;
  logHabitValue: (params: { habitId: string; date: string; value: number; note?: string }) => Promise<any>;
  toggleHabitCheck: (params: { habitId: string; date: string }) => void;
  deleteHabit: (habitId: string) => Promise<any>;
  addHabitSection: (params: { name: string }) => Promise<any>;
  updateHabitSection: (params: { id: string } & Partial<HabitSection>) => Promise<any>;
  deleteHabitSection: (id: string) => Promise<any>;
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

export const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

function getModuleFromPath(pathname: string | null): WorkspaceModule {
  if (!pathname) return "tasks";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/matrix")) return "matrix";
  if (pathname.startsWith("/habits")) return "habits";
  if (pathname.startsWith("/analytics") || pathname.startsWith("/statistics")) return "statistics";
  if (pathname.startsWith("/pomodoro")) return "pomodoro";
  if (pathname.startsWith("/timeline")) return "timeline";
  if (pathname.startsWith("/countdown")) return "countdown";
  if (pathname.startsWith("/settings")) return "settings";
  return "tasks";
}

function getPathFromModule(mod: WorkspaceModule): string {
  switch (mod) {
    case "calendar":
      return "/calendar";
    case "matrix":
      return "/matrix";
    case "habits":
      return "/habits";
    case "statistics":
      return "/analytics";
    case "pomodoro":
      return "/pomodoro";
    case "timeline":
      return "/timeline";
    case "countdown":
      return "/countdowns";
    case "settings":
      return "/settings";
    case "tasks":
    default:
      return "/tasks";
  }
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const fetchingCount = useIsFetching();
  const isBackgroundFetching = fetchingCount > 0;

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Navigation State derived from URL
  const activeModule: WorkspaceModule = useMemo(() => getModuleFromPath(pathname), [pathname]);

  const activeView = useMemo(() => {
    if (activeModule !== "tasks") return "today";
    return searchParams.get("view") || "today";
  }, [activeModule, searchParams]);

  const activeListId = useMemo(() => {
    return searchParams.get("listId") || null;
  }, [searchParams]);

  const activeTag = useMemo(() => {
    return searchParams.get("tag") || null;
  }, [searchParams]);

  const activeFilterId = useMemo(() => {
    return searchParams.get("filterId") || null;
  }, [searchParams]);

  const taskLayout: "list" | "kanban" = useMemo(() => {
    return searchParams.get("layout") === "kanban" ? "kanban" : "list";
  }, [searchParams]);

  const selectedTaskId = useMemo(() => {
    return searchParams.get("taskId") || null;
  }, [searchParams]);

  const statsRange: "week" | "month" | "quarter" | "year" = useMemo(() => {
    const r = searchParams.get("range");
    if (r === "week" || r === "month" || r === "quarter" || r === "year") return r;
    return "month";
  }, [searchParams]);

  const calView: "month" | "week" | "day" | "agenda" | "year" = useMemo(() => {
    const v = searchParams.get("view");
    if (v === "month" || v === "week" || v === "day" || v === "agenda" || v === "year") return v;
    return "month";
  }, [searchParams]);

  const calDate: Date = useMemo(() => {
    const d = searchParams.get("date");
    if (d && !isNaN(Date.parse(d))) {
      return new Date(d);
    }
    return new Date();
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState<string>("");

  // Expandable Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("workspace-sidebar-open");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("workspace-sidebar-width");
      const num = Number(saved);
      if (num >= 200 && num <= 450) return num;
    }
    return 260;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleSetSidebarWidth = (w: number) => {
    const clamped = Math.max(200, Math.min(450, w));
    setSidebarWidth(clamped);
    if (typeof window !== "undefined") {
      localStorage.setItem("workspace-sidebar-width", String(clamped));
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("workspace-sidebar-open", String(isSidebarOpen));
    }
  }, [isSidebarOpen]);

  // Global Ctrl+B / Cmd+B keyboard shortcut to toggle sidebar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        toggleSidebar();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Modals State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [habitStatus, setHabitStatus] = useState<"ACTIVE" | "ARCHIVED" | "ALL">("ACTIVE");
  const [habitAnalyticsHabitId, setHabitAnalyticsHabitId] = useState<string>("all");

  // TanStack Query Hook integration
  const workspace = useWorkspace({
    activeModule,
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
    habitStatus,
    habitAnalyticsHabitId,
  });

  // Track if initial domain queries have resolved at least once
  const [hasLoadedTasksOnce, setHasLoadedTasksOnce] = useState(false);
  const [hasLoadedHabitsOnce, setHasLoadedHabitsOnce] = useState(false);
  const [hasLoadedListsOnce, setHasLoadedListsOnce] = useState(false);
  const [hasLoadedTagsOnce, setHasLoadedTagsOnce] = useState(false);
  const [hasLoadedFiltersOnce, setHasLoadedFiltersOnce] = useState(false);

  useEffect(() => {
    if (!workspace.isLoadingTasks || workspace.allActiveTasks.length > 0) {
      setHasLoadedTasksOnce(true);
    }
  }, [workspace.isLoadingTasks, workspace.allActiveTasks]);

  useEffect(() => {
    if (!workspace.isLoadingHabits || workspace.habits.length > 0) {
      setHasLoadedHabitsOnce(true);
    }
  }, [workspace.isLoadingHabits, workspace.habits]);

  useEffect(() => {
    if (!workspace.isLoadingLists || workspace.lists.length > 0) {
      setHasLoadedListsOnce(true);
    }
  }, [workspace.isLoadingLists, workspace.lists]);

  useEffect(() => {
    if (!workspace.isLoadingTags || workspace.tags.length > 0) {
      setHasLoadedTagsOnce(true);
    }
  }, [workspace.isLoadingTags, workspace.tags]);

  useEffect(() => {
    if (!workspace.isLoadingFilters || workspace.filters.length > 0) {
      setHasLoadedFiltersOnce(true);
    }
  }, [workspace.isLoadingFilters, workspace.filters]);

  const isInitialLoadingTasks = !hasLoadedTasksOnce && workspace.isLoadingTasks && workspace.allActiveTasks.length === 0;
  const isInitialLoadingHabits = !hasLoadedHabitsOnce && workspace.isLoadingHabits && workspace.habits.length === 0;
  const isInitialLoadingLists = !hasLoadedListsOnce && workspace.isLoadingLists && workspace.lists.length === 0;
  const isInitialLoadingTags = !hasLoadedTagsOnce && workspace.isLoadingTags && workspace.tags.length === 0;
  const isInitialLoadingFilters = !hasLoadedFiltersOnce && workspace.isLoadingFilters && workspace.filters.length === 0;

  const today = getTodayISO();
  const tomorrow = addDays(today, 1);
  const next7Days = addDays(today, 7);

  // Dynamic in-memory counts derived directly from allActiveTasks
  const { inboxCount, todayCount, tomorrowCount, allCount, listCounts, tagCounts } = useMemo(() => {
    let inbox = 0;
    let todayC = 0;
    let tomorrowC = 0;
    let all = 0;
    const lCounts: Record<string, number> = {};
    const tCounts: Record<string, number> = {};

    for (const t of workspace.allActiveTasks) {
      if (t.isTrash) continue;
      if (!t.completed) {
        all++;
        if (!t.listId) inbox++;
        if (t.dueDate && t.dueDate <= today) todayC++;
        if (t.dueDate === tomorrow) tomorrowC++;
        if (t.listId) {
          lCounts[t.listId] = (lCounts[t.listId] || 0) + 1;
        }
        if (t.tags && Array.isArray(t.tags)) {
          for (const item of t.tags) {
            const tagName = item.tag?.name;
            if (tagName) {
              tCounts[tagName] = (tCounts[tagName] || 0) + 1;
            }
          }
        }
      }
    }

    return {
      inboxCount: inbox,
      todayCount: todayC,
      tomorrowCount: tomorrowC,
      allCount: all,
      listCounts: lCounts,
      tagCounts: tCounts,
    };
  }, [workspace.allActiveTasks, today, tomorrow]);

  const listsWithCounts = useMemo(() => {
    return workspace.lists.map((l) => ({
      ...l,
      _count: { tasks: listCounts[l.id] || 0 },
    }));
  }, [workspace.lists, listCounts]);

  const tagsWithCounts = useMemo(() => {
    return workspace.tags.map((tg) => ({
      ...tg,
      _count: { tasks: tagCounts[tg.name] || 0 },
    }));
  }, [workspace.tags, tagCounts]);

  // In-memory filtered tasks for the active view/filter/search
  const derivedTasks = useMemo(() => {
    if (activeView === "trash") {
      return workspace.trashTasks;
    }

    let result = workspace.allActiveTasks;

    // 1. Module / View Filter
    if (activeModule === "calendar" || activeModule === "timeline") {
      // Calendar and timeline show all scheduled tasks across dates
    } else if (activeView === "today") {
      result = result.filter((t) => t.dueDate && t.dueDate <= today);
    } else if (activeView === "tomorrow") {
      result = result.filter((t) => t.dueDate === tomorrow);
    } else if (activeView === "next7") {
      result = result.filter((t) => t.dueDate && t.dueDate >= today && t.dueDate <= next7Days);
    } else if (activeView === "inbox") {
      result = result.filter((t) => !t.listId);
    } else if (activeView === "completed") {
      result = result.filter((t) => t.completed);
    }
    // "all" takes all active tasks

    // 2. Custom List Filter
    if (activeListId && activeListId !== "inbox" && activeListId !== "all") {
      result = result.filter((t) => t.listId === activeListId);
    }

    // 3. Tag Filter
    if (activeTag) {
      result = result.filter((t) => t.tags?.some((tagItem) => tagItem.tag?.name === activeTag));
    }

    // 4. Search Filter
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // 5. Smart Filter
    if (activeFilterId) {
      const filter = workspace.filters.find((f: any) => f.id === activeFilterId);
      if (filter && filter.query) {
        const queryObj = filter.query;
        result = result.filter((t) => {
          if (queryObj.priority !== undefined && queryObj.priority !== null) {
            if (t.priority !== queryObj.priority) return false;
          }
          if (queryObj.completed !== undefined) {
            if (t.completed !== queryObj.completed) return false;
          }
          if (queryObj.listId) {
            if (t.listId !== queryObj.listId) return false;
          }
          return true;
        });
      }
    }

    return result;
  }, [
    activeModule,
    activeView,
    activeListId,
    activeTag,
    searchQuery,
    activeFilterId,
    workspace.allActiveTasks,
    workspace.trashTasks,
    workspace.filters,
    today,
    tomorrow,
    next7Days,
  ]);

  // Calculate current list/view name
  const currentListName = useMemo(() => {
    if (activeListId) {
      const l = workspace.lists.find((item) => item.id === activeListId);
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
  }, [activeListId, activeTag, activeView, workspace.lists]);

  // Current active list object
  const currentList = useMemo(() => {
    if (activeListId) {
      return workspace.lists.find((item) => item.id === activeListId) || null;
    }
    return null;
  }, [activeListId, workspace.lists]);

  // Selected Task
  const selectedTask = useMemo(
    () => (activeView === "trash" ? workspace.trashTasks : workspace.allActiveTasks).find((t) => t.id === selectedTaskId) || null,
    [workspace.allActiveTasks, workspace.trashTasks, activeView, selectedTaskId]
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

  // Helper navigation methods with Next.js router integration
  const selectModule = useCallback(
    (mod: WorkspaceModule) => {
      const targetPath = getPathFromModule(mod);
      if (targetPath !== pathname) {
        router.push(targetPath);
      }
    },
    [pathname, router]
  );

  const setActiveModule = useCallback(
    (mod: WorkspaceModule) => {
      selectModule(mod);
    },
    [selectModule]
  );

  const selectView = useCallback(
    (view: string, listId?: string | null, tag?: string | null) => {
      const params = new URLSearchParams();
      if (view) params.set("view", view);
      if (listId) params.set("listId", listId);
      if (tag) params.set("tag", tag);
      if (searchParams.get("layout") === "kanban") params.set("layout", "kanban");
      const qs = params.toString() ? `?${params.toString()}` : "";
      router.push(`/tasks${qs}`);
    },
    [searchParams, router]
  );

  const setActiveView = useCallback(
    (view: string) => {
      selectView(view, activeListId, activeTag);
    },
    [selectView, activeListId, activeTag]
  );

  const setActiveListId = useCallback(
    (listId: string | null) => {
      selectView(activeView, listId, activeTag);
    },
    [selectView, activeView, activeTag]
  );

  const setActiveTag = useCallback(
    (tag: string | null) => {
      selectView(activeView, activeListId, tag);
    },
    [selectView, activeView, activeListId]
  );

  const selectFilter = useCallback(
    (filterId: string) => {
      const params = new URLSearchParams();
      params.set("filterId", filterId);
      if (searchParams.get("layout") === "kanban") params.set("layout", "kanban");
      router.push(`/tasks?${params.toString()}`);
    },
    [searchParams, router]
  );

  const setActiveFilterId = useCallback(
    (filterId: string | null) => {
      if (filterId) {
        selectFilter(filterId);
      } else {
        selectView("today", null, null);
      }
    },
    [selectFilter, selectView]
  );

  const setTaskLayout = useCallback(
    (layout: "list" | "kanban") => {
      const params = new URLSearchParams(searchParams.toString());
      if (layout === "kanban") {
        params.set("layout", "kanban");
      } else {
        params.delete("layout");
      }
      const qs = params.toString() ? `?${params.toString()}` : "";
      router.replace(`${pathname || "/tasks"}${qs}`, { scroll: false });
    },
    [pathname, searchParams, router]
  );

  const setSelectedTaskId = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) {
        params.set("taskId", id);
      } else {
        params.delete("taskId");
      }
      const qs = params.toString() ? `?${params.toString()}` : "";
      router.replace(`${pathname || "/tasks"}${qs}`, { scroll: false });
    },
    [pathname, searchParams, router]
  );

  const setStatsRange = useCallback(
    (range: "week" | "month" | "quarter" | "year") => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", range);
      router.replace(`${pathname || "/analytics"}?${params.toString()}`, { scroll: false });
    },
    [pathname, searchParams, router]
  );

  const setCalView = useCallback(
    (v: "month" | "week" | "day" | "agenda" | "year") => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", v);
      router.replace(`${pathname || "/calendar"}?${params.toString()}`, { scroll: false });
    },
    [pathname, searchParams, router]
  );

  const setCalDate = useCallback(
    (date: Date) => {
      const params = new URLSearchParams(searchParams.toString());
      const iso = format(date, "yyyy-MM-dd");
      params.set("date", iso);
      router.replace(`${pathname || "/calendar"}?${params.toString()}`, { scroll: false });
    },
    [pathname, searchParams, router]
  );

  const refetchAll = async () => {
    await queryClient.invalidateQueries();
  };

  const contextValue: WorkspaceContextType = {
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
    currentList,
    calView,
    setCalView,
    calDate,
    setCalDate,

    // Sidebar State
    isSidebarOpen,
    setIsSidebarOpen,
    toggleSidebar,
    sidebarWidth,
    setSidebarWidth: handleSetSidebarWidth,

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

    // Data from useWorkspace
    allActiveTasks: workspace.allActiveTasks,
    tasks: derivedTasks,
    isLoadingTasks: workspace.isLoadingTasks,
    isInitialLoadingTasks,
    hasLoadedTasksOnce,
    isErrorTasks: workspace.isErrorTasks,
    tasksError: workspace.tasksError,
    refetchTasks: workspace.refetchTasks,
    lists: listsWithCounts,
    isLoadingLists: workspace.isLoadingLists,
    isInitialLoadingLists,
    hasLoadedListsOnce,
    isErrorLists: workspace.isErrorLists,
    listsError: workspace.listsError,
    refetchLists: workspace.refetchLists,
    inboxCount,
    todayCount,
    tomorrowCount,
    allCount,
    tags: tagsWithCounts,
    isLoadingTags: workspace.isLoadingTags,
    isInitialLoadingTags,
    hasLoadedTagsOnce,
    pomodoroStats: workspace.pomodoroStats,
    habits: workspace.habits,
    isLoadingHabits: workspace.isLoadingHabits,
    isInitialLoadingHabits,
    hasLoadedHabitsOnce,
    habitSections: workspace.habitSections,
    isLoadingHabitSections: workspace.isLoadingHabitSections,
    habitStatus,
    setHabitStatus,
    habitAnalytics: workspace.habitAnalytics,
    isLoadingHabitAnalytics: workspace.isLoadingHabitAnalytics,
    habitAnalyticsHabitId,
    setHabitAnalyticsHabitId,
    filters: workspace.filters,
    isLoadingFilters: workspace.isLoadingFilters,
    isInitialLoadingFilters,
    hasLoadedFiltersOnce,
    countdowns: workspace.countdowns,
    stats: workspace.stats,
    isLoadingStats: workspace.isLoadingStats,
    settings: workspace.settings,
    reminders: workspace.reminders,
    members: workspace.members,
    assignees: workspace.assignees,
    subscriptions: workspace.subscriptions,

    // Mutations from useWorkspace
    toggleComplete: workspace.toggleComplete,
    addTask: workspace.addTask,
    updateTask: workspace.updateTask,
    deleteTask: workspace.deleteTask,
    batchAction: workspace.batchAction,
    addList: workspace.addList,
    updateList: workspace.updateList,
    deleteList: workspace.deleteList,
    addTag: workspace.addTag,
    deleteTag: workspace.deleteTag,
    logPomodoro: workspace.logPomodoro,
    addHabit: workspace.addHabit,
    updateHabit: workspace.updateHabit,
    archiveHabit: workspace.archiveHabit,
    restoreHabit: workspace.restoreHabit,
    skipHabitDay: workspace.skipHabitDay,
    logHabitValue: workspace.logHabitValue,
    toggleHabitCheck: workspace.toggleHabitCheck,
    deleteHabit: workspace.deleteHabit,
    addHabitSection: workspace.addHabitSection,
    updateHabitSection: workspace.updateHabitSection,
    deleteHabitSection: workspace.deleteHabitSection,
    createFilter: workspace.createFilter,
    updateFilter: workspace.updateFilter,
    deleteFilter: workspace.deleteFilter,
    addCountdown: workspace.addCountdown,
    updateCountdown: workspace.updateCountdown,
    deleteCountdown: workspace.deleteCountdown,
    updateSettings: workspace.updateSettings,
    addReminder: workspace.addReminder,
    updateReminder: workspace.updateReminder,
    deleteReminder: workspace.deleteReminder,
    inviteMember: workspace.inviteMember,
    updateMember: workspace.updateMember,
    removeMember: workspace.removeMember,
    setAssignees: workspace.setAssignees,
    addSubscription: workspace.addSubscription,
    deleteSubscription: workspace.deleteSubscription,
    syncSubscription: workspace.syncSubscription,
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspaceContext must be used within a WorkspaceProvider");
  }
  return context;
}
