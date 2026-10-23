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
} from "lucide-react";
import { Task } from "@/hooks/use-ticktick";
import { getTodayISO, addDays, formatShortDate } from "@/lib/date-utils";
import { TickTickContext } from "@/context/ticktick-context";

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
  const context = useContext(TickTickContext);

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

  // Multi-select state
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"default" | "date" | "priority" | "title">("default");
  const [groupBy, setGroupBy] = useState<"date" | "priority" | "list" | "none">("date");
  const [showCompleted, setShowCompleted] = useState<boolean>(true);

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
        return "text-[var(--tt-muted)]";
    }
  }

  function renderTaskItem(task: Task) {
    const isSelected = selectedTaskId === task.id;
    const isCheckedInBatch = selectedTaskIds.includes(task.id);
    const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;

    const isOverdue = task.dueDate && task.dueDate < today && !task.completed;
    const isDueToday = task.dueDate === today && !task.completed;

    return (
      <div
        key={task.id}
        onClick={() => onSelectTask(task.id)}
        className={`group relative flex items-center justify-between gap-3 rounded-xl border-y border-r p-2.5 sm:px-3.5 transition-all cursor-pointer ${getPriorityColor( task.priority )} ${ isSelected ? "border-y-[var(--tt-accent)]/40 border-r-[var(--tt-accent)]/40 bg-[var(--tt-accent)]/10 shadow-xs" : isCheckedInBatch ? "border-y-indigo-500/40 border-r-indigo-500/40 bg-indigo-500/10" : "border-y-[var(--tt-border)] border-r-[var(--tt-border)] bg-[var(--tt-panel)] hover:bg-[var(--tt-panel-alt)]" } ${task.completed ? "opacity-60" : ""}`}
      >
        {/* Left: Multi-select checkbox + Completion Checkbox + Title + Badges */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Multi-select box (visible on hover or when checked) */}
          <button
            type="button"
            onClick={(e) => toggleSelectTask(e, task.id)}
            title="Select for batch action"
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-[var(--tt-muted)] hover:text-[var(--tt-text)] ${ isCheckedInBatch ? "!opacity-100 text-[var(--tt-accent-text)] font-bold" : "" }`}
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
            className={`flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-md border transition-all active:scale-90 ${ task.completed ? "border-[var(--tt-accent)] bg-[var(--tt-accent-strong)] text-white shadow-xs shadow-[var(--tt-accent)]/30" : task.priority === 3 ? "border-rose-500 hover:bg-rose-500/20" : task.priority === 2 ? "border-amber-500 hover:bg-amber-500/20" : task.priority === 1 ? "border-blue-400 hover:bg-blue-500/20" : "border-[var(--tt-border)] hover:border-[var(--tt-accent)] dark:hover:border-[var(--tt-accent)]" }`}
          >
            {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
          </button>

          {/* Quick inline Priority Flag */}
          <button
            type="button"
            onClick={(e) => cyclePriority(e, task)}
            title={`Priority: ${task.priority === 3 ? "High" : task.priority === 2 ? "Medium" : task.priority === 1 ? "Low" : "None"}. Click to cycle.`}
            className={`p-0.5 rounded transition-all ${ task.priority === 3 ? "text-rose-500" : task.priority === 2 ? "text-amber-500" : task.priority === 1 ? "text-blue-400" : "text-[var(--tt-muted)] dark:text-[var(--tt-text)] hover:text-[var(--tt-muted)]" }`}
          >
            <Flag className="h-3 w-3 fill-current" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`tt-heading font-semibold truncate ${ task.completed ? "line-through text-[var(--tt-muted)]" : "text-[var(--tt-text)] dark:text-[var(--tt-text)]" }`}
              >
                {task.title}
              </span>
            </div>

            {/* Badges row: List, Subtasks, Pomodoro, Due Date, Tags */}
            <div className="mt-1 flex flex-wrap items-center gap-2 tt-meta text-[var(--tt-muted)]">
              {task.list && (
                <span className="flex items-center gap-1 font-semibold" style={{ color: task.list.color }}>
                  <Folder className="h-3 w-3" />
                  {task.list.name}
                </span>
              )}

              {task.dueDate && (
                <span
                  className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 font-medium ${ isOverdue ? "bg-rose-500/15 text-rose-500 font-bold" : isDueToday ? "bg-[var(--tt-accent)]/15 text-[var(--tt-accent-text)] font-bold" : "bg-[var(--tt-panel-alt)] text-[var(--tt-text)] dark:bg-[var(--tt-panel-alt)] dark:text-[var(--tt-muted)]" }`}
                >
                  <Calendar className="h-2.5 w-2.5" />
                  {task.dueDate === today
                    ? "Today"
                    : task.dueDate === tomorrow
                    ? "Tomorrow"
                    : formatShortDate(task.dueDate)}
                  {task.dueTime && ` ${task.dueTime}`}
                </span>
              )}

              {task.recurrence && task.recurrence !== "NONE" && (
                <span className="flex items-center gap-0.5 text-indigo-400" title={`Repeats ${task.recurrence}`}>
                  <Repeat className="h-2.5 w-2.5" />
                  {task.recurrence.toLowerCase()}
                </span>
              )}

              {totalSubtasks > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--tt-muted)]">
                  <CheckCircle2 className="h-3 w-3 text-[var(--tt-accent-text)]" />
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
              className="rounded p-1 text-[var(--tt-muted)] hover:text-[var(--tt-accent-text)] transition-colors"
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
            className={`rounded p-1 transition-colors ${ task.isPinned ? "text-amber-400" : "text-[var(--tt-muted)] hover:text-amber-400" }`}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(task.id);
            }}
            title="Move to trash"
            className="rounded p-1 text-[var(--tt-muted)] hover:text-rose-500 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  function renderSection(title: string, sectionTasks: Task[], badgeColor: string = "text-[var(--tt-muted)]") {
    if (sectionTasks.length === 0) return null;
    return (
      <div key={title} className="space-y-1.5">
        <div className="flex items-center gap-2 px-1 tt-overline font-semibold text-[var(--tt-muted)]">
          <span className={badgeColor}>{title}</span>
          <span className="tt-meta text-[var(--tt-muted)]">({sectionTasks.length})</span>
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
          {renderSection("No Priority", none, "text-[var(--tt-muted)]")}
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
            renderSection(listTitle, tasksInList, "text-[var(--tt-accent-text)]")
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
        {renderSection("Today", todayList, "text-[var(--tt-accent-text)]")}
        {renderSection("Tomorrow", tomorrowList, "text-amber-400")}
        {renderSection("Upcoming", upcoming, "text-indigo-400")}
        {renderSection("No Due Date", noDate, "text-[var(--tt-muted)]")}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Control bar: Sort & Group By & Select All */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2 tt-label text-[var(--tt-muted)] border-b border-[var(--tt-border)]/80 mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAllIncomplete}
            className="hover:text-[var(--tt-text)] transition-colors font-medium"
          >
            {selectedTaskIds.length > 0 ? `Deselect All` : `Select All`}
          </button>
          <span className="text-[var(--tt-text)]">•</span>
          <span>{incompleteTasks.length} active</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Group By selector */}
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-[var(--tt-muted)]" />
            <select
              value={groupBy}
              onChange={(e: any) => setGroupBy(e.target.value)}
              className="bg-transparent tt-label text-[var(--tt-muted)] focus:outline-none cursor-pointer"
            >
              <option value="date">Group: Date</option>
              <option value="priority">Group: Priority</option>
              <option value="list">Group: List</option>
              <option value="none">Group: None</option>
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-[var(--tt-muted)]" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent tt-label text-[var(--tt-muted)] focus:outline-none cursor-pointer"
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
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--tt-muted)]">
            <h2 className="flex items-center gap-2 tt-heading font-semibold text-[var(--tt-text)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--tt-accent-text)]" />
              No tasks in {viewName}
            </h2>
            <p className="tt-label text-[var(--tt-muted)] mt-1 max-w-xs">
              Add a task with the input bar above, or take a break.
            </p>
          </div>
        ) : (
          <>
            {renderGroupedTasks()}

            {/* Completed Tasks section with toggle */}
            {completedTasks.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-1.5 tt-overline font-semibold text-[var(--tt-muted)] hover:text-[var(--tt-muted)]"
                >
                  {showCompleted ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  <span>Completed ({completedTasks.length})</span>
                </button>
                {showCompleted && (
                  <div className="space-y-1.5">{completedTasks.map(renderTaskItem)}</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Batch Actions Bar (TickTick Signature Feature) */}
      {selectedTaskIds.length > 0 && onBatchAction && (
        <div className="absolute bottom-3 left-4 right-4 z-30 flex items-center justify-between rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-rail)]/95 p-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-[var(--tt-accent-strong)] px-2 py-0.5 tt-label font-semibold text-white">
              {selectedTaskIds.length}
            </span>
            <span className="tt-label font-medium text-[var(--tt-text)]">Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await onBatchAction({ taskIds: selectedTaskIds, action: "complete", value: true });
                setSelectedTaskIds([]);
              }}
              className="rounded-lg bg-[var(--tt-accent)]/20 px-2.5 py-1 tt-label font-medium text-[var(--tt-accent-text)] hover:bg-[var(--tt-accent-strong)]/30"
            >
              Complete ✓
            </button>

            <button
              type="button"
              onClick={async () => {
                await onBatchAction({ taskIds: selectedTaskIds, action: "dueDate", value: today });
                setSelectedTaskIds([]);
              }}
              className="rounded-lg bg-[var(--tt-panel-alt)] px-2.5 py-1 tt-label font-medium text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)]"
            >
              Set Today
            </button>

            <button
              type="button"
              onClick={async () => {
                await onBatchAction({ taskIds: selectedTaskIds, action: "priority", value: 3 });
                setSelectedTaskIds([]);
              }}
              className="rounded-lg bg-rose-500/20 px-2.5 py-1 tt-label font-medium text-rose-400 hover:bg-rose-500/30"
            >
              High Priority
            </button>

            <button
              type="button"
              onClick={async () => {
                await onBatchAction({ taskIds: selectedTaskIds, action: "delete" });
                setSelectedTaskIds([]);
              }}
              className="rounded-lg p-1 text-[var(--tt-muted)] hover:text-rose-400 hover:bg-[var(--tt-panel-alt)]"
              title="Delete selected"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedTaskIds([])}
              className="rounded-lg p-1 text-[var(--tt-muted)] hover:text-white hover:bg-[var(--tt-panel-alt)]"
              title="Cancel selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
