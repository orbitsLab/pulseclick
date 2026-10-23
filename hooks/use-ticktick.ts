"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { playTaskCompleteSound, playPomodoroBellSound } from "@/lib/sound-utils";

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface TaskTag {
  taskId: string;
  tagId: string;
  tag: {
    id: string;
    name: string;
    color: string;
  };
}

export interface TaskList {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  order: number;
  _count?: { tasks: number };
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  userId: string;
  listId?: string | null;
  title: string;
  description?: string | null;
  completed: boolean;
  completedAt?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  priority: number; // 0: None, 1: Low, 2: Medium, 3: High
  recurrence: string; // NONE, DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM
  recurrenceInterval?: number;
  recurrenceWeekdays?: string | null;
  recurrenceEndDate?: string | null;
  reminder?: string | null; // NONE, AT_TIME, 5_MIN, 15_MIN, 30_MIN, 1_HOUR, 1_DAY
  isPinned: boolean;
  isTrash: boolean;
  kanbanStatus: "TODO" | "IN_PROGRESS" | "DONE";
  pomodoroCount: number;
  order: number;
  startDate?: string | null;
  startTime?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  durationMinutes?: number;
  timeZone?: string | null;
  createdAt: string;
  updatedAt: string;
  list?: TaskList | null;
  subtasks: Subtask[];
  tags: TaskTag[];
  reminders?: TaskReminder[];
  assignees?: { member: ListMember }[];
}

export interface PomodoroStats {
  sessions: any[];
  todayTotalMinutes: number;
  todayPomoCount: number;
}

export interface TaskReminder {
  id: string;
  taskId: string;
  type: string;
  remindAt?: string | null;
  minutesBefore?: number | null;
  enabled: boolean;
}

export interface ListMember {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  assignments?: number;
}

export interface Countdown {
  id: string;
  title: string;
  targetDate: string;
  color: string;
  emoji?: string | null;
  repeat: string;
}

export interface CalendarSubscription {
  id: string;
  name: string;
  url: string;
  color: string;
  listId?: string | null;
  lastSyncedAt?: string | null;
}

export interface UserSettings {
  themeId: string;
  timezone: string;
  listBackgrounds?: Record<string, string>;
}

export interface StatisticsData {
  range: "week" | "month" | "quarter" | "year";
  tasks: { created: number; completed: number; open: number; completionRate: number };
  byDay: { date: string; created: number; completed: number }[];
  byPriority: { priority: number; count: number }[];
  byList: {
    listId: string | null;
    name: string;
    color?: string | null;
    count: number;
    completed: number;
  }[];
  focus: {
    totalMinutes: number;
    sessions: number;
    byDay: { date: string; minutes: number }[];
  };
  habits: {
    streaks: {
      title: string;
      color?: string | null;
      streak: number;
      completionRate: number;
      totalLogs: number;
    }[];
    logs: number;
  };
  busiest: { date: string; count: number }[];
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  icon: string;
  color: string;
  frequency: string;
  targetDays: number;
  streak: number;
  isCompletedToday: boolean;
  logs: HabitLog[];
}

export function useTickTick(filters: {
  view: string;
  listId?: string | null;
  tag?: string | null;
  search?: string;
  filterId?: string | null;
  statsRange?: "week" | "month" | "quarter" | "year";
  remindersTaskId?: string | null;
  membersListId?: string | null;
  assigneesTaskId?: string | null;
}) {
  const queryClient = useQueryClient();

  // 1. Tasks Query
  const tasksQueryKey = [
    "ticktick-tasks",
    filters.view,
    filters.listId,
    filters.tag,
    filters.search,
    filters.filterId,
  ];
  const tasksQuery = useQuery({
    queryKey: tasksQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.view) params.set("view", filters.view);
      if (filters.listId) params.set("listId", filters.listId);
      if (filters.tag) params.set("tag", filters.tag);
      if (filters.search) params.set("search", filters.search);
      if (filters.filterId) params.set("filter", filters.filterId);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = await res.json();
      return (data.tasks || []) as Task[];
    },
  });

  // 2. Task Lists Query
  const listsQuery = useQuery({
    queryKey: ["ticktick-lists"],
    queryFn: async () => {
      const res = await fetch("/api/tasks/lists");
      if (!res.ok) throw new Error("Failed to load lists");
      const data = await res.json();
      return {
        lists: (data.lists || []) as TaskList[],
        inboxCount: (data.inboxCount || 0) as number,
        todayCount: (data.todayCount || 0) as number,
        tomorrowCount: (data.tomorrowCount || 0) as number,
        allCount: (data.allCount || 0) as number,
      };
    },
  });

  // 3. Tags Query
  const tagsQuery = useQuery({
    queryKey: ["ticktick-tags"],
    queryFn: async () => {
      const res = await fetch("/api/tasks/tags");
      if (!res.ok) throw new Error("Failed to load tags");
      const data = await res.json();
      return (data.tags || []) as Tag[];
    },
  });

  // 4. Pomodoro Stats Query
  const pomodoroQuery = useQuery({
    queryKey: ["ticktick-pomodoro"],
    queryFn: async () => {
      const res = await fetch("/api/pomodoro");
      if (!res.ok) return { sessions: [], todayTotalMinutes: 0, todayPomoCount: 0 };
      const data = await res.json();
      return data as PomodoroStats;
    },
  });

  // 5. Habits Query
  const habitsQuery = useQuery({
    queryKey: ["ticktick-habits"],
    queryFn: async () => {
      const res = await fetch("/api/habits");
      if (!res.ok) return [];
      const data = await res.json();
      return (data.habits || []) as Habit[];
    },
  });

  // 6. Smart Filters Query
  const filtersQuery = useQuery({
    queryKey: ["ticktick-filters"],
    queryFn: async () => {
      const res = await fetch("/api/filters");
      if (!res.ok) return [];
      const data = await res.json();
      return (data.filters || []) as any[];
    },
  });

  // 7. Countdowns Query
  const countdownsQuery = useQuery({
    queryKey: ["ticktick-countdowns"],
    queryFn: async () => {
      const res = await fetch("/api/countdowns");
      if (!res.ok) return [];
      const data = await res.json();
      return (data.countdowns || []) as Countdown[];
    },
  });

  // 8. Statistics Query
  const statsRange = filters.statsRange ?? "month";
  const statsQuery = useQuery({
    queryKey: ["ticktick-stats", statsRange],
    queryFn: async () => {
      const res = await fetch(`/api/stats?range=${statsRange}`);
      if (!res.ok) return null;
      return (await res.json()) as StatisticsData;
    },
  });

  // 9. Settings Query
  const settingsQuery = useQuery({
    queryKey: ["ticktick-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) return null;
      return (await res.json()) as UserSettings;
    },
  });

  // 10. Reminders Query (for the selected task)
  const remindersTaskId = filters.remindersTaskId ?? null;
  const remindersQuery = useQuery({
    queryKey: ["ticktick-reminders", remindersTaskId],
    queryFn: async () => {
      if (!remindersTaskId) return [];
      const res = await fetch(`/api/reminders?taskId=${remindersTaskId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.reminders || []) as TaskReminder[];
    },
    enabled: Boolean(remindersTaskId),
  });

  // 11. List Members Query (collaboration)
  // The member list belongs to the list that owns the selected task.
  const membersListId = useMemo(() => {
    const task = (tasksQuery.data || []).find((t) => t.id === filters.remindersTaskId);
    return task?.listId ?? null;
  }, [tasksQuery.data, filters.remindersTaskId]);
  const membersQuery = useQuery({
    queryKey: ["ticktick-members", membersListId],
    queryFn: async () => {
      if (!membersListId) return [];
      const res = await fetch(`/api/lists/${membersListId}/members`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.members || []) as ListMember[];
    },
    enabled: Boolean(membersListId),
  });

  // 12. Task Assignees Query
  const assigneesTaskId = filters.assigneesTaskId ?? null;
  const assigneesQuery = useQuery({
    queryKey: ["ticktick-assignees", assigneesTaskId],
    queryFn: async () => {
      if (!assigneesTaskId) return [];
      const res = await fetch(`/api/tasks/${assigneesTaskId}/assignees`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.assignees || []) as ListMember[];
    },
    enabled: Boolean(assigneesTaskId),
  });

  // 13. Calendar Subscriptions Query
  const subscriptionsQuery = useQuery({
    queryKey: ["ticktick-subscriptions"],
    queryFn: async () => {
      const res = await fetch("/api/calendars/subscriptions");
      if (!res.ok) return [];
      const data = await res.json();
      return (data.subscriptions || []) as CalendarSubscription[];
    },
  });

  // ---------------- MUTATIONS WITH OPTIMISTIC UPDATES ---------------- //

  // Toggle Task Completion
  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error("Failed to toggle task");
      return res.json();
    },
    onMutate: async ({ taskId, completed }) => {
      if (completed) {
        playTaskCompleteSound();
      }
      await queryClient.cancelQueries({ queryKey: tasksQueryKey });
      const prevTasks = queryClient.getQueryData<Task[]>(tasksQueryKey) || [];

      // Optimistically update
      const updated = prevTasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed,
              kanbanStatus: completed ? ("DONE" as const) : t.kanbanStatus,
            }
          : t
      );
      queryClient.setQueryData(tasksQueryKey, updated);
      return { prevTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevTasks) queryClient.setQueryData(tasksQueryKey, context.prevTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ticktick-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["ticktick-lists"] });
    },
  });

  // Add Task
  const addTaskMutation = useMutation({
    mutationFn: async (newTask: {
      title: string;
      description?: string;
      listId?: string | null;
      dueDate?: string | null;
      dueTime?: string | null;
      priority?: number;
      recurrence?: string;
      recurrenceInterval?: number;
      recurrenceWeekdays?: string | null;
      recurrenceEndDate?: string | null;
      reminder?: string;
      tags?: string[];
      subtasks?: any[];
      kanbanStatus?: string;
      startDate?: string | null;
      startTime?: string | null;
      endDate?: string | null;
      endTime?: string | null;
      durationMinutes?: number;
      timeZone?: string | null;
      reminders?: any[];
      assigneeIds?: string[];
    }) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (!res.ok) throw new Error("Failed to add task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticktick-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["ticktick-lists"] });
      queryClient.invalidateQueries({ queryKey: ["ticktick-tags"] });
    },
  });

  // Update Task
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, ...updates }: { taskId: string } & Partial<Task>) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onMutate: async ({ taskId, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey });
      const prevTasks = queryClient.getQueryData<Task[]>(tasksQueryKey) || [];

      const updated = prevTasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
      queryClient.setQueryData(tasksQueryKey, updated);
      return { prevTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevTasks) queryClient.setQueryData(tasksQueryKey, context.prevTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ticktick-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["ticktick-lists"] });
      queryClient.invalidateQueries({ queryKey: ["ticktick-tags"] });
    },
  });

  // Delete Task
  const deleteTaskMutation = useMutation({
    mutationFn: async ({ taskId, permanent }: { taskId: string; permanent?: boolean }) => {
      const res = await fetch(`/api/tasks/${taskId}?permanent=${permanent ? "true" : "false"}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");
      return res.json();
    },
    onMutate: async ({ taskId }) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey });
      const prevTasks = queryClient.getQueryData<Task[]>(tasksQueryKey) || [];
      queryClient.setQueryData(
        tasksQueryKey,
        prevTasks.filter((t) => t.id !== taskId)
      );
      return { prevTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevTasks) queryClient.setQueryData(tasksQueryKey, context.prevTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ticktick-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["ticktick-lists"] });
    },
  });

  // Batch Action on Tasks
  const batchActionMutation = useMutation({
    mutationFn: async ({
      taskIds,
      action,
      value,
    }: {
      taskIds: string[];
      action: "complete" | "delete" | "priority" | "dueDate" | "moveList";
      value?: any;
    }) => {
      const res = await fetch("/api/tasks/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds, action, value }),
      });
      if (!res.ok) throw new Error("Failed to execute batch action");
      return res.json();
    },
    onMutate: async ({ taskIds, action, value }) => {
      if (action === "complete" && value === true) {
        playTaskCompleteSound();
      }
      await queryClient.cancelQueries({ queryKey: tasksQueryKey });
      const prevTasks = queryClient.getQueryData<Task[]>(tasksQueryKey) || [];

      let updated = [...prevTasks];
      if (action === "complete") {
        updated = updated.map((t) =>
          taskIds.includes(t.id) ? { ...t, completed: Boolean(value) } : t
        );
      } else if (action === "delete") {
        updated = updated.filter((t) => !taskIds.includes(t.id));
      } else if (action === "priority") {
        updated = updated.map((t) =>
          taskIds.includes(t.id) ? { ...t, priority: Number(value) } : t
        );
      } else if (action === "dueDate") {
        updated = updated.map((t) =>
          taskIds.includes(t.id) ? { ...t, dueDate: value || null } : t
        );
      }
      queryClient.setQueryData(tasksQueryKey, updated);
      return { prevTasks };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ticktick-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["ticktick-lists"] });
    },
  });

  // Add List
  const addListMutation = useMutation({
    mutationFn: async ({ name, color, icon }: { name: string; color: string; icon?: string }) => {
      const res = await fetch("/api/tasks/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, icon }),
      });
      if (!res.ok) throw new Error("Failed to create list");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticktick-lists"] });
    },
  });

  // Update List
  const updateListMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; color?: string; icon?: string }) => {
      const res = await fetch(`/api/tasks/lists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update list");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticktick-lists"] });
      queryClient.invalidateQueries({ queryKey: ["ticktick-tasks"] });
    },
  });

  // Delete List
  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/lists/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete list");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticktick-lists"] });
      queryClient.invalidateQueries({ queryKey: ["ticktick-tasks"] });
    },
  });

  // Add Tag
  const addTagMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const res = await fetch("/api/tasks/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      if (!res.ok) throw new Error("Failed to create tag");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticktick-tags"] });
    },
  });

  // Delete Tag
  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/tags/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete tag");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticktick-tags"] });
      queryClient.invalidateQueries({ queryKey: ["ticktick-tasks"] });
    },
  });

  // Log Pomodoro Session
  const logPomodoroMutation = useMutation({
    mutationFn: async ({ taskId, durationMinutes }: { taskId?: string; durationMinutes: number }) => {
      const res = await fetch("/api/pomodoro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, durationMinutes }),
      });
      if (!res.ok) throw new Error("Failed to record pomodoro");
      return res.json();
    },
    onSuccess: () => {
      playPomodoroBellSound();
      queryClient.invalidateQueries({ queryKey: ["ticktick-pomodoro"] });
      queryClient.invalidateQueries({ queryKey: ["ticktick-tasks"] });
    },
  });

  // Add Habit
  const addHabitMutation = useMutation({
    mutationFn: async (newHabit: {
      title: string;
      icon?: string;
      color?: string;
      frequency?: string;
      targetDays?: number;
    }) => {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHabit),
      });
      if (!res.ok) throw new Error("Failed to add habit");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticktick-habits"] });
    },
  });

  // Toggle Habit Check
  const toggleHabitCheckMutation = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      const res = await fetch(`/api/habits/${habitId}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) throw new Error("Failed to check habit");
      return res.json();
    },
    onMutate: async ({ habitId, date }) => {
      playTaskCompleteSound();
      await queryClient.cancelQueries({ queryKey: ["ticktick-habits"] });
      const prevHabits = queryClient.getQueryData<Habit[]>(["ticktick-habits"]) || [];

      const updated = prevHabits.map((h) => {
        if (h.id !== habitId) return h;
        const exists = h.logs?.some((l) => l.date === date && l.completed);
        let nextLogs = h.logs || [];
        if (exists) {
          nextLogs = nextLogs.filter((l) => l.date !== date);
        } else {
          nextLogs = [...nextLogs, { id: `temp-${Date.now()}`, habitId, date, completed: true }];
        }
        return {
          ...h,
          logs: nextLogs,
          isCompletedToday: date === new Date().toISOString().split("T")[0] ? !exists : h.isCompletedToday,
        };
      });

      queryClient.setQueryData(["ticktick-habits"], updated);
      return { prevHabits };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevHabits) queryClient.setQueryData(["ticktick-habits"], context.prevHabits);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ticktick-habits"] });
    },
  });

  // Delete Habit
  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      const res = await fetch(`/api/habits/${habitId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete habit");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticktick-habits"] });
    },
  });

  // ---------------- NEW FEATURE MUTATIONS ---------------- //

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ["ticktick-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["ticktick-lists"] });
    queryClient.invalidateQueries({ queryKey: ["ticktick-stats"] });
  };

  // Smart filters
  const createFilterMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      icon?: string;
      color?: string;
      query?: any;
    }) => {
      const res = await fetch("/api/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create filter");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticktick-filters"] }),
  });

  const updateFilterMutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<{ name: string; icon: string; color: string; query: any }>) => {
      const res = await fetch(`/api/filters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update filter");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticktick-filters"] }),
  });

  const deleteFilterMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/filters/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete filter");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticktick-filters"] }),
  });

  // Countdowns
  const addCountdownMutation = useMutation({
    mutationFn: async (input: {
      title: string;
      targetDate: string;
      color?: string;
      emoji?: string;
      repeat?: string;
    }) => {
      const res = await fetch("/api/countdowns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to add countdown");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticktick-countdowns"] }),
  });

  const updateCountdownMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Countdown>) => {
      const res = await fetch(`/api/countdowns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update countdown");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticktick-countdowns"] }),
  });

  const deleteCountdownMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/countdowns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete countdown");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticktick-countdowns"] }),
  });

  // Settings (theme / timezone)
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: { themeId?: string; timezone?: string }) => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticktick-settings"] }),
  });

  // Reminders
  const addReminderMutation = useMutation({
    mutationFn: async (input: {
      taskId: string;
      type: string;
      remindAt?: string;
      minutesBefore?: number;
    }) => {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to add reminder");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticktick-reminders"] }),
  });

  const updateReminderMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TaskReminder>) => {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update reminder");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticktick-reminders"] }),
  });

  const deleteReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete reminder");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticktick-reminders"] }),
  });

  // Collaboration
  const inviteMemberMutation = useMutation({
    mutationFn: async (input: {
      listId: string;
      email: string;
      displayName?: string;
      role?: string;
    }) => {
      const res = await fetch(`/api/lists/${input.listId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to invite member");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticktick-members"] });
      invalidateTasks();
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({
      memberId,
      ...updates
    }: { memberId: string } & Partial<{ role: string; status: string; displayName: string }>) => {
      const res = await fetch(`/api/lists/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update member");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticktick-members"] }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/lists/members/${memberId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove member");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticktick-members"] });
      invalidateTasks();
    },
  });

  const setAssigneesMutation = useMutation({
    mutationFn: async ({ taskId, memberIds }: { taskId: string; memberIds: string[] }) => {
      const res = await fetch(`/api/tasks/${taskId}/assignees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds }),
      });
      if (!res.ok) throw new Error("Failed to update assignees");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticktick-assignees"] });
      invalidateTasks();
    },
  });

  // Calendar subscriptions
  const addSubscriptionMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      url: string;
      color?: string;
      listId?: string | null;
    }) => {
      const res = await fetch("/api/calendars/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to subscribe to calendar");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["ticktick-subscriptions"] }),
  });

  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/calendars/subscriptions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete subscription");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["ticktick-subscriptions"] }),
  });

  const syncSubscriptionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/calendars/subscriptions/${id}/sync`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sync calendar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticktick-subscriptions"] });
      invalidateTasks();
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoadingTasks: tasksQuery.isLoading,
    lists: listsQuery.data?.lists || [],
    inboxCount: listsQuery.data?.inboxCount || 0,
    todayCount: listsQuery.data?.todayCount || 0,
    tomorrowCount: listsQuery.data?.tomorrowCount || 0,
    allCount: listsQuery.data?.allCount || 0,
    tags: tagsQuery.data || [],
    pomodoroStats: pomodoroQuery.data || { sessions: [], todayTotalMinutes: 0, todayPomoCount: 0 },
    habits: habitsQuery.data || [],
    isLoadingHabits: habitsQuery.isLoading,
    filters: filtersQuery.data || [],
    countdowns: countdownsQuery.data || [],
    stats: statsQuery.data ?? null,
    isLoadingStats: statsQuery.isLoading,
    settings: settingsQuery.data ?? null,
    reminders: remindersQuery.data || [],
    members: membersQuery.data || [],
    assignees: assigneesQuery.data || [],
    subscriptions: subscriptionsQuery.data || [],

    toggleComplete: toggleCompleteMutation.mutate,
    addTask: addTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutateAsync,
    batchAction: batchActionMutation.mutateAsync,
    addList: addListMutation.mutateAsync,
    updateList: updateListMutation.mutateAsync,
    deleteList: deleteListMutation.mutateAsync,
    addTag: addTagMutation.mutateAsync,
    deleteTag: deleteTagMutation.mutateAsync,
    logPomodoro: logPomodoroMutation.mutateAsync,
    addHabit: addHabitMutation.mutateAsync,
    toggleHabitCheck: toggleHabitCheckMutation.mutate,
    deleteHabit: deleteHabitMutation.mutateAsync,
    createFilter: createFilterMutation.mutateAsync,
    updateFilter: updateFilterMutation.mutateAsync,
    deleteFilter: deleteFilterMutation.mutateAsync,
    addCountdown: addCountdownMutation.mutateAsync,
    updateCountdown: updateCountdownMutation.mutateAsync,
    deleteCountdown: deleteCountdownMutation.mutateAsync,
    updateSettings: updateSettingsMutation.mutateAsync,
    addReminder: addReminderMutation.mutateAsync,
    updateReminder: updateReminderMutation.mutateAsync,
    deleteReminder: deleteReminderMutation.mutateAsync,
    inviteMember: inviteMemberMutation.mutateAsync,
    updateMember: updateMemberMutation.mutateAsync,
    removeMember: removeMemberMutation.mutateAsync,
    setAssignees: setAssigneesMutation.mutateAsync,
    addSubscription: addSubscriptionMutation.mutateAsync,
    deleteSubscription: deleteSubscriptionMutation.mutateAsync,
    syncSubscription: syncSubscriptionMutation.mutateAsync,
  };
}
