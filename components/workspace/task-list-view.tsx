"use client";

import React, { useState, useContext } from "react";
import {
  Check,
  Flag,
  Calendar,
  Pin,
  Repeat,
  Trash2,
  CheckCircle2,
  Folder,
  ArrowUpDown,
  CheckSquare,
  Square,
  X,
  ChevronDown,
  ChevronRight,
  Layers,
  Sunrise,
  AlertCircle,
} from "lucide-react";
import { Task } from "@/hooks/use-workspace";
import { getTodayISO, addDays, formatShortDate, formatTaskSchedule } from "@/lib/date-utils";
import { WorkspaceContext } from "@/context/workspace-context";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TaskListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2 py-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--app-border)]/60 bg-[var(--app-panel)]/30 p-2.5 transition-opacity"
          style={{ opacity: Math.max(0.35, 1 - i * 0.15) }}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Skeleton className="h-4.5 w-4.5 rounded-md shrink-0 bg-[var(--app-panel-alt)]" />
            <Skeleton
              className="h-4 rounded-md bg-[var(--app-panel-alt)]"
              style={{ width: `${Math.max(35, 75 - (i % 3) * 15)}%` }}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-4.5 w-16 rounded-md bg-[var(--app-panel-alt)]/70 hidden sm:block" />
            <Skeleton className="h-4.5 w-20 rounded-md bg-[var(--app-panel-alt)]/70" />
            <Skeleton className="h-4 w-4 rounded-full bg-[var(--app-panel-alt)]/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface TaskListViewProps {
  tasks?: Task[];
  selectedTaskId?: string | null;
  onSelectTask?: (taskId: string) => void;
  onToggleComplete?: (taskId: string, completed: boolean) => void;
  onTogglePin?: (taskId: string, isPinned: boolean) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdateTask?: (params: { taskId: string } & Partial<Task>) => void;
  onBatchAction?: (params: {
    taskIds: string[];
    action: "complete" | "delete" | "priority" | "dueDate";
    value?: any;
  }) => Promise<any>;
  viewName?: string;
}

export function TaskListView(props: TaskListViewProps = {}) {
  const context = useContext(WorkspaceContext);

  const tasks = props.tasks ?? context?.tasks ?? [];
  const selectedTaskId = props.selectedTaskId !== undefined ? props.selectedTaskId : (context?.selectedTaskId ?? null);
  const onSelectTask = props.onSelectTask ?? context?.setSelectedTaskId ?? (() => {});
  const onToggleComplete = props.onToggleComplete ?? ((id, completed) => context?.toggleComplete({ taskId: id, completed }));
  const onTogglePin = props.onTogglePin ?? ((id, isPinned) => context?.updateTask({ taskId: id, isPinned }));
  const onDeleteTask = props.onDeleteTask ?? ((id) => context?.deleteTask({ taskId: id }));
  const onUpdateTask = props.onUpdateTask ?? context?.updateTask;
  const onBatchAction = props.onBatchAction ?? context?.batchAction;
  const viewName = props.viewName ?? context?.currentListName ?? "Tasks";
  const today = getTodayISO();
  const tomorrow = addDays(today, 1);
  const next7Days = addDays(today, 7);
  const isInitialLoading = (context?.isInitialLoadingTasks || (context?.isLoadingTasks && !context?.hasLoadedTasksOnce)) && tasks.length === 0;

  // Multi-select state
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"default" | "date" | "priority" | "title">("default");
  const [groupBy, setGroupBy] = useState<"date" | "priority" | "list" | "none">("date");
  const isCompletedView = viewName === "Completed" || context?.activeView === "completed";
  const [showCompleted, setShowCompleted] = useState<boolean>(() => isCompletedView);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  React.useEffect(() => {
    if (isCompletedView) {
      setShowCompleted(true);
    }
  }, [isCompletedView]);

  // Sorting
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === "date") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (sortBy === "priority") {
      return b.priority - a.priority;
    }
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    // Default: Pinned first, then incomplete by priority, then creation
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (b.priority !== a.priority) return b.priority - a.priority;
    return 0;
  });

  const incompleteTasks = sortedTasks.filter((t) => !t.completed);
  const completedTasks = sortedTasks.filter((t) => t.completed);

  function toggleSelectTask(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function selectAllIncomplete() {
    if (selectedTaskIds.length === incompleteTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(incompleteTasks.map((t) => t.id));
    }
  }

  function cyclePriority(e: React.MouseEvent, task: Task) {
    e.stopPropagation();
    if (!onUpdateTask) return;
    const nextPriority = (task.priority + 1) % 4; // 0 -> 1 -> 2 -> 3 -> 0
    onUpdateTask({ taskId: task.id, priority: nextPriority });
  }

  function getPriorityColor(priority: number) {
    // Priority is carried by the coloured flag icon; a coloured card edge would
    // be a decorative stripe with no extra information.
    switch (priority) {
      case 3:
        return "text-rose-500";
      case 2:
        return "text-amber-500";
      case 1:
        return "text-blue-400";
      default:
        return "text-[var(--app-muted)]";
    }
  }

  function renderTaskItem(task: Task) {
    const isSelected = selectedTaskId === task.id;
    const isCheckedInBatch = selectedTaskIds.includes(task.id);
    const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;

    const isOverdue = task.dueDate && task.dueDate < today && !task.completed;
    const isDueToday = task.dueDate === today && !task.completed;
    const schedule = formatTaskSchedule(task);

    return (
      <div
        key={task.id}
        onClick={() => onSelectTask(task.id)}
        className={`group relative flex items-center justify-between gap-3 rounded-xl border-y border-r p-2.5 sm:px-3.5 transition-all cursor-pointer ${getPriorityColor( task.priority )} ${ isSelected ? "border-y-[var(--app-accent)]/40 border-r-[var(--app-accent)]/40 bg-[var(--app-accent)]/10 shadow-xs" : isCheckedInBatch ? "border-y-indigo-500/40 border-r-indigo-500/40 bg-indigo-500/10" : "border-y-[var(--app-border)] border-r-[var(--app-border)] bg-[var(--app-panel)] hover:bg-[var(--app-panel-alt)]" } ${task.completed ? "opacity-60" : ""}`}
      >
        {/* Left: Multi-select checkbox + Completion Checkbox + Title + Badges */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Multi-select box (visible on hover or when checked) */}
          <button
            type="button"
            onClick={(e) => toggleSelectTask(e, task.id)}
            title="Select for batch action"
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-[var(--app-muted)] hover:text-[var(--app-text)] ${ isCheckedInBatch ? "!opacity-100 text-[var(--app-accent-text)] font-bold" : "" }`}
          >
            {isCheckedInBatch ? (
              <CheckSquare className="h-3.5 w-3.5" />
            ) : (
              <Square className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Complete toggle checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task.id, !task.completed);
            }}
            className={`flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-md border transition-all active:scale-90 ${ task.completed ? "border-[var(--app-accent)] bg-[var(--app-accent-strong)] text-white shadow-xs shadow-[var(--app-accent)]/30" : task.priority === 3 ? "border-rose-500 hover:bg-rose-500/20" : task.priority === 2 ? "border-amber-500 hover:bg-amber-500/20" : task.priority === 1 ? "border-blue-400 hover:bg-blue-500/20" : "border-[var(--app-border)] hover:border-[var(--app-accent)] dark:hover:border-[var(--app-accent)]" }`}
          >
            {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
          </button>

          {/* Quick inline Priority Flag */}
          <button
            type="button"
            onClick={(e) => cyclePriority(e, task)}
            title={`Priority: ${task.priority === 3 ? "High" : task.priority === 2 ? "Medium" : task.priority === 1 ? "Low" : "None"}. Click to cycle.`}
            className={`p-0.5 rounded transition-all ${ task.priority === 3 ? "text-rose-500" : task.priority === 2 ? "text-amber-500" : task.priority === 1 ? "text-blue-400" : "text-[var(--app-muted)] dark:text-[var(--app-text)] hover:text-[var(--app-muted)]" }`}
          >
            <Flag className="h-3 w-3 fill-current" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`app-heading font-semibold truncate ${ task.completed ? "line-through text-[var(--app-muted)]" : "text-[var(--app-text)] dark:text-[var(--app-text)]" }`}
              >
                {task.title}
              </span>

              {!task.completed && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextStatus =
                      task.kanbanStatus === "IN_PROGRESS" ? "TODO" : "IN_PROGRESS";
                    onUpdateTask?.({ taskId: task.id, kanbanStatus: nextStatus });
                  }}
                  title={`Status: ${task.kanbanStatus === "IN_PROGRESS" ? "In Progress" : "To Do"}. Click to toggle.`}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 app-meta font-medium transition-colors cursor-pointer ${
                    task.kanbanStatus === "IN_PROGRESS"
                      ? "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border border-amber-500/30"
                      : "bg-[var(--app-panel-alt)] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:border-[var(--app-border)] border border-[var(--app-border)]/60"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      task.kanbanStatus === "IN_PROGRESS"
                        ? "bg-amber-500"
                        : "bg-slate-400"
                    }`}
                  />
                  <span>
                    {task.kanbanStatus === "IN_PROGRESS" ? "In Progress" : "To Do"}
                  </span>
                </button>
              )}
            </div>

            {/* Badges row: List, Subtasks, Pomodoro, Due Date, Tags */}
            <div className="mt-1 flex flex-wrap items-center gap-2 app-meta text-[var(--app-muted)]">
              {task.list && (
                <span className="flex items-center gap-1 font-semibold" style={{ color: task.list.color }}>
                  <Folder className="h-3 w-3" />
                  {task.list.name}
                </span>
              )}

              {schedule && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium transition-colors app-meta",
                    schedule.isOverdue
                      ? "bg-rose-500/15 text-rose-500 font-bold"
                      : schedule.isDueToday
                      ? "bg-[var(--app-accent)]/15 text-[var(--app-accent-text)] font-semibold"
                      : "bg-[var(--app-panel-alt)] text-[var(--app-text)] dark:text-[var(--app-muted)]"
                  )}
                >
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>{schedule.dateLabel}</span>
                  {schedule.timeLabel && (
                    <span className="opacity-80 font-mono app-meta">{schedule.timeLabel}</span>
                  )}
                  {schedule.durationBadge && (
                    <span className="ml-0.5 rounded px-1 py-0.2 bg-[var(--app-accent)]/20 text-[var(--app-accent-text)] font-mono app-meta font-semibold">
                      {schedule.durationBadge}
                    </span>
                  )}
                </span>
              )}

              {task.recurrence && task.recurrence !== "NONE" && (
                <span className="flex items-center gap-0.5 text-indigo-400" title={`Repeats ${task.recurrence}`}>
                  <Repeat className="h-2.5 w-2.5" />
                  {task.recurrence.toLowerCase()}
                </span>
              )}

              {totalSubtasks > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--app-muted)]">
                  <CheckCircle2 className="h-3 w-3 text-[var(--app-accent-text)]" />
                  {completedSubtasks}/{totalSubtasks}
                </span>
              )}

              {task.pomodoroCount > 0 && (
                <span className="inline-flex items-center gap-0.5 text-rose-400 font-semibold" title="Focus sessions">
                  🍅 {task.pomodoroCount}
                </span>
              )}

              {task.tags?.map(({ tag }) => (
                <span
                  key={tag.id}
                  className="rounded px-1.5 py-0.2 font-semibold"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right action icons on hover: Quick Reschedule, Pin, Trash */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Quick Reschedule to Today / Tomorrow */}
          {task.dueDate !== today && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateTask?.({ taskId: task.id, dueDate: today });
              }}
              title="Set to Today"
              className="rounded p-1 text-[var(--app-muted)] hover:text-[var(--app-accent-text)] transition-colors"
            >
              <Calendar className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(task.id, !task.isPinned);
            }}
            title={task.isPinned ? "Unpin task" : "Pin task to top"}
            className={`rounded p-1 transition-colors ${ task.isPinned ? "text-amber-400" : "text-[var(--app-muted)] hover:text-amber-400" }`}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setTaskToDelete(task);
            }}
            title="Move to trash"
            className="rounded p-1 text-[var(--app-muted)] hover:text-rose-500 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  function renderSection(title: string, sectionTasks: Task[], badgeColor: string = "text-[var(--app-muted)]") {
    if (sectionTasks.length === 0) return null;
    return (
      <div key={title} className="space-y-1.5">
        <div className="flex items-center gap-2 px-1 app-overline font-semibold text-[var(--app-muted)]">
          <span className={badgeColor}>{title}</span>
          <span className="app-meta text-[var(--app-muted)]">({sectionTasks.length})</span>
        </div>
        <div className="space-y-1.5">{sectionTasks.map(renderTaskItem)}</div>
      </div>
    );
  }

  // Render grouped tasks based on groupBy setting
  function renderGroupedTasks() {
    if (groupBy === "none") {
      return <div className="space-y-1.5">{incompleteTasks.map(renderTaskItem)}</div>;
    }

    if (groupBy === "priority") {
      const high = incompleteTasks.filter((t) => t.priority === 3);
      const med = incompleteTasks.filter((t) => t.priority === 2);
      const low = incompleteTasks.filter((t) => t.priority === 1);
      const none = incompleteTasks.filter((t) => t.priority === 0);

      return (
        <div className="space-y-4">
          {renderSection("High Priority", high, "text-rose-500")}
          {renderSection("Medium Priority", med, "text-amber-400")}
          {renderSection("Low Priority", low, "text-blue-400")}
          {renderSection("No Priority", none, "text-[var(--app-muted)]")}
        </div>
      );
    }

    if (groupBy === "list") {
      const listMap = new Map<string, Task[]>();
      incompleteTasks.forEach((t) => {
        const key = t.list?.name || "Inbox";
        const current = listMap.get(key) || [];
        listMap.set(key, [...current, t]);
      });

      return (
        <div className="space-y-4">
          {Array.from(listMap.entries()).map(([listTitle, tasksInList]) =>
            renderSection(listTitle, tasksInList, "text-[var(--app-accent-text)]")
          )}
        </div>
      );
    }

    // Default: Group by Date
    const pinned = incompleteTasks.filter((t) => t.isPinned);
    const unpinned = incompleteTasks.filter((t) => !t.isPinned);

    const overdue = unpinned.filter((t) => t.dueDate && t.dueDate < today);
    const todayList = unpinned.filter((t) => t.dueDate === today);
    const tomorrowList = unpinned.filter((t) => t.dueDate === tomorrow);
    const upcoming = unpinned.filter((t) => t.dueDate && t.dueDate > tomorrow);
    const noDate = unpinned.filter((t) => !t.dueDate);

    return (
      <div className="space-y-4">
        {renderSection("Pinned", pinned, "text-amber-400")}
        {renderSection("Overdue", overdue, "text-rose-500")}
        {renderSection("Today", todayList, "text-[var(--app-accent-text)]")}
        {renderSection("Tomorrow", tomorrowList, "text-amber-400")}
        {renderSection("Upcoming", upcoming, "text-indigo-400")}
        {renderSection("No Due Date", noDate, "text-[var(--app-muted)]")}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Control bar: Sort & Group By & Select All */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2 app-label text-[var(--app-muted)] border-b border-[var(--app-border)]/80 mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAllIncomplete}
            className="hover:text-[var(--app-text)] transition-colors font-medium"
          >
            {selectedTaskIds.length > 0 ? `Deselect All` : `Select All`}
          </button>
          <span className="text-[var(--app-text)]">•</span>
          <span>{incompleteTasks.length} active</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Group By selector */}
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-[var(--app-muted)]" />
            <select
              value={groupBy}
              onChange={(e: any) => setGroupBy(e.target.value)}
              className="bg-transparent app-label text-[var(--app-muted)] focus:outline-none cursor-pointer"
            >
              <option value="date">Group: Date</option>
              <option value="priority">Group: Priority</option>
              <option value="list">Group: List</option>
              <option value="none">Group: None</option>
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-[var(--app-muted)]" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent app-label text-[var(--app-muted)] focus:outline-none cursor-pointer"
            >
              <option value="default">Default Sort</option>
              <option value="date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-1 pb-16">
        {isInitialLoading ? (
          <TaskListSkeleton count={5} />
        ) : context?.isErrorTasks ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-rose-500">
            <AlertCircle className="h-8 w-8 text-rose-500 mb-2 opacity-90" />
            <h2 className="app-heading font-semibold text-rose-500">
              Failed to load tasks
            </h2>
            <p className="app-label text-[var(--app-muted)] mt-1 max-w-sm">
              {context.tasksError?.message || "There was an issue connecting to the database."}
            </p>
            <button
              type="button"
              onClick={() => context.refetchTasks?.()}
              className="mt-4 px-3.5 py-1.5 rounded-lg bg-[var(--app-accent-strong)] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              Retry
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--app-muted)]">
            <h2 className="flex items-center gap-2 app-heading font-semibold text-[var(--app-text)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--app-accent-text)]" />
              No tasks in {viewName}
            </h2>
            <p className="app-label text-[var(--app-muted)] mt-1 max-w-xs">
              Add a task with the input bar above, or take a break.
            </p>
          </div>
        ) : (
          <>
            {renderGroupedTasks()}

            {/* Completed Tasks section with toggle */}
            {completedTasks.length > 0 && (
              <div className="space-y-1.5 pt-4 border-t border-[var(--app-border)]/60">
                <button
                  type="button"
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-1.5 app-overline font-semibold text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors cursor-pointer"
                >
                  {showCompleted ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  <span>Completed & Won&apos;t Do</span>
                  <span className="rounded-full bg-[var(--app-panel-alt)] px-1.5 py-0.2 app-meta text-[var(--app-muted)]">
                    {completedTasks.length}
                  </span>
                </button>
                {showCompleted && (
                  <div className="space-y-1.5 pt-1">{completedTasks.map(renderTaskItem)}</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Batch Actions Bar */}
      {selectedTaskIds.length > 0 && onBatchAction && (
        <div className="absolute bottom-3 left-4 right-4 z-30 flex items-center justify-between rounded-2xl border border-[var(--app-border)] bg-[var(--app-rail)]/95 p-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-[var(--app-accent-strong)] px-2 py-0.5 app-label font-semibold text-white">
              {selectedTaskIds.length}
            </span>
            <span className="app-label font-medium text-[var(--app-text)]">Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await onBatchAction({ taskIds: selectedTaskIds, action: "complete", value: true });
                setSelectedTaskIds([]);
              }}
              className="rounded-lg bg-[var(--app-accent)]/20 px-2.5 py-1 app-label font-medium text-[var(--app-accent-text)] hover:bg-[var(--app-accent-strong)]/30"
            >
              Complete ✓
            </button>

            <button
              type="button"
              onClick={async () => {
                await onBatchAction({ taskIds: selectedTaskIds, action: "dueDate", value: today });
                setSelectedTaskIds([]);
              }}
              className="rounded-lg bg-[var(--app-panel-alt)] px-2.5 py-1 app-label font-medium text-[var(--app-muted)] hover:bg-[var(--app-panel-alt)]"
            >
              Set Today
            </button>

            <button
              type="button"
              onClick={async () => {
                await onBatchAction({ taskIds: selectedTaskIds, action: "priority", value: 3 });
                setSelectedTaskIds([]);
              }}
              className="rounded-lg bg-rose-500/20 px-2.5 py-1 app-label font-medium text-rose-400 hover:bg-rose-500/30"
            >
              High Priority
            </button>

            <button
              type="button"
              onClick={async () => {
                await onBatchAction({ taskIds: selectedTaskIds, action: "delete" });
                setSelectedTaskIds([]);
              }}
              className="rounded-lg p-1 text-[var(--app-muted)] hover:text-rose-400 hover:bg-[var(--app-panel-alt)]"
              title="Delete selected"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedTaskIds([])}
              className="rounded-lg p-1 text-[var(--app-muted)] hover:text-white hover:bg-[var(--app-panel-alt)]"
              title="Cancel selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={Boolean(taskToDelete)}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
        title="Delete Task"
        description={`Are you sure you want to delete "${taskToDelete?.title}"? This task will be moved to trash.`}
        onConfirm={() => {
          if (taskToDelete) {
            onDeleteTask(taskToDelete.id);
            setTaskToDelete(null);
          }
        }}
      />
    </div>
  );
}
