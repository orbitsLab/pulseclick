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
  FolderPlus,
  ArrowUpDown,
  CheckSquare,
  Square,
  X,
  ChevronDown,
  ChevronRight,
  Layers,
  Sunrise,
  AlertCircle,
  Plus,
  Pencil,
} from "lucide-react";
import { Task, TaskGroup } from "@/hooks/use-workspace";
import { getTodayISO, addDays, formatShortDate, formatTaskSchedule } from "@/lib/date-utils";
import { WorkspaceContext } from "@/context/workspace-context";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

export function TaskListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2 py-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel)] p-2.5 transition-opacity"
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
  const [groupBy, setGroupBy] = useState<"group" | "date" | "priority" | "list" | "none">("date");
  const isCompletedView = viewName === "Completed" || context?.activeView === "completed";
  const [showCompleted, setShowCompleted] = useState<boolean>(() => isCompletedView);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Group sections state
  const isCustomList = Boolean(
    context?.activeListId &&
    context.activeListId !== "inbox" &&
    context.activeListId !== "all"
  );
  const currentListGroups = isCustomList
    ? (context?.taskGroups || []).filter((g) => g.listId === context?.activeListId)
    : [];

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState<Record<string, string>>({});

  // Group modals state
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("#4772fa");

  const [editingGroup, setEditingGroup] = useState<TaskGroup | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupColor, setEditGroupColor] = useState("#4772fa");

  const [groupToDelete, setGroupToDelete] = useState<TaskGroup | null>(null);

  const colorPalette = [
    "#9b9a97", // Gray
    "#64473a", // Brown
    "#d9730d", // Orange
    "#dfab01", // Yellow
    "#0f7b6c", // Green
    "#0b6e99", // Blue
    "#6940a5", // Purple
    "#ad1a72", // Pink
    "#e03e3e", // Red
  ];

  const toggleSectionCollapse = (groupId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  React.useEffect(() => {
    if (isCustomList && currentListGroups.length > 0) {
      setGroupBy("group");
    }
  }, [context?.activeListId, currentListGroups.length]);

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

    const isWontDo = Boolean(task.completed && task.kanbanStatus === "WONT_DO");

    return (
      <div
        key={task.id}
        draggable={!task.completed}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/taskId", task.id);
          e.dataTransfer.setData("text/plain", task.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        onClick={() => onSelectTask(task.id)}
        className={cn(
          "group relative flex items-center justify-between gap-2.5 rounded-[4px] border border-[var(--app-border)]/70 py-1.5 px-2.5 sm:px-3 transition-colors cursor-pointer select-none mb-1",
          isSelected
            ? "border-[var(--app-accent)]/50 bg-[var(--app-active)]"
            : isCheckedInBatch
            ? "border-[var(--app-accent)]/40 bg-[var(--app-accent)]/10"
            : "bg-[var(--app-panel)] hover:bg-[var(--app-hover)]",
          task.completed && "opacity-60"
        )}
      >
        {/* Left: Multi-select checkbox + Completion Checkbox + Title + Badges */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Multi-select box (visible on hover or when checked) */}
          <button
            type="button"
            onClick={(e) => toggleSelectTask(e, task.id)}
            title="Select for batch action"
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-[3px] text-[var(--app-muted)] hover:text-[var(--app-text)] ${ isCheckedInBatch ? "!opacity-100 text-[var(--app-accent-text)] font-bold" : "" }`}
          >
            {isCheckedInBatch ? (
              <CheckSquare className="h-3.5 w-3.5" />
            ) : (
              <Square className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Complete toggle checkbox with Context Menu for Won't Do */}
          <ContextMenu>
            <ContextMenuTrigger className="inline-flex items-center justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete(task.id, !task.completed);
                }}
                title={
                  task.completed
                    ? isWontDo
                      ? "Won't Do (Right-click for options)"
                      : "Completed (Right-click for options)"
                    : "Mark complete (Right-click for options)"
                }
                className={cn(
                  "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[3px] border transition-colors cursor-pointer",
                  task.completed
                    ? isWontDo
                      ? "border-[#e03e3e] bg-[#e03e3e] text-white shadow-xs"
                      : "border-[var(--app-accent)] bg-[var(--app-accent)] text-white shadow-xs"
                    : task.priority === 3
                    ? "border-[#e03e3e] hover:bg-[#e03e3e]/20"
                    : task.priority === 2
                    ? "border-[#dfab01] hover:bg-[#dfab01]/20"
                    : task.priority === 1
                    ? "border-[#2383e2] hover:bg-[#2383e2]/20"
                    : "border-[var(--app-border)] hover:border-[var(--app-accent)]"
                )}
              >
                {task.completed && (
                  isWontDo ? (
                    <X className="h-3 w-3 stroke-[3]" />
                  ) : (
                    <Check className="h-3 w-3 stroke-[3]" />
                  )
                )}
              </button>
            </ContextMenuTrigger>

            <ContextMenuContent
              onClick={(e) => e.stopPropagation()}
              className="w-48 bg-[var(--app-panel)] border-[var(--app-border)] text-[var(--app-text)] shadow-[0_4px_16px_rgba(15,15,15,0.1),0_0_0_1px_rgba(15,15,15,0.08)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.08)] p-1 z-50 rounded-md"
            >
              <ContextMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  const nextCompleted = task.completed && !isWontDo ? false : true;
                  onUpdateTask?.({
                    taskId: task.id,
                    completed: nextCompleted,
                    kanbanStatus: nextCompleted ? "DONE" : "TODO",
                  });
                }}
                className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-[4px] text-xs hover:bg-[var(--app-hover)] text-[var(--app-text)]"
              >
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#0f7b6c] stroke-[2.5]" />
                  Completed
                </span>
                {task.completed && !isWontDo && (
                  <Check className="h-3.5 w-3.5 text-[#0f7b6c]" />
                )}
              </ContextMenuItem>

              <ContextMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  const nextWonDo = isWontDo ? false : true;
                  onUpdateTask?.({
                    taskId: task.id,
                    completed: nextWonDo,
                    kanbanStatus: nextWonDo ? "WONT_DO" : "TODO",
                  });
                }}
                className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-[4px] text-xs hover:bg-[var(--app-hover)] text-[var(--app-text)]"
              >
                <span className="flex items-center gap-1.5">
                  <X className="h-3.5 w-3.5 text-[#e03e3e] stroke-[2.5]" />
                  Won&apos;t Do
                </span>
                {isWontDo && <Check className="h-3.5 w-3.5 text-[#e03e3e]" />}
              </ContextMenuItem>

              {task.completed && (
                <>
                  <ContextMenuSeparator className="my-1 bg-[var(--app-border)]" />
                  <ContextMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateTask?.({
                        taskId: task.id,
                        completed: false,
                        kanbanStatus: "TODO",
                      });
                    }}
                    className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-[4px] text-xs text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover)]"
                  >
                    <span>Mark Incomplete</span>
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuContent>
          </ContextMenu>

          {/* Quick inline Priority Flag */}
          <button
            type="button"
            onClick={(e) => cyclePriority(e, task)}
            title={`Priority: ${task.priority === 3 ? "High" : task.priority === 2 ? "Medium" : task.priority === 1 ? "Low" : "None"}. Click to cycle.`}
            className={`p-0.5 rounded-[3px] transition-colors cursor-pointer ${
              task.priority === 3
                ? "text-[#e03e3e]"
                : task.priority === 2
                ? "text-[#dfab01]"
                : task.priority === 1
                ? "text-[#2383e2]"
                : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
            }`}
          >
            <Flag className="h-3 w-3 fill-current" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs sm:text-sm font-medium truncate ${
                  task.completed ? "line-through text-[var(--app-muted)]" : "text-[var(--app-text)]"
                }`}
              >
                {task.title}
              </span>

              {isWontDo && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-[3px] px-1.5 py-0.2 text-[10px] font-semibold bg-[#e03e3e]/15 text-[#e03e3e] border border-[#e03e3e]/25">
                  <X className="h-2.5 w-2.5 stroke-[2.5]" />
                  Won&apos;t Do
                </span>
              )}

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
                    "inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                    schedule.isOverdue
                      ? "bg-[#e03e3e]/15 text-[#e03e3e]"
                      : schedule.isDueToday
                      ? "bg-[var(--app-accent)]/15 text-[var(--app-accent-text)]"
                      : "bg-[var(--app-panel-alt)] text-[var(--app-muted)] border border-[var(--app-border)]/60"
                  )}
                >
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>{schedule.dateLabel}</span>
                  {schedule.timeLabel && (
                    <span className="opacity-80 font-mono text-[10px]">{schedule.timeLabel}</span>
                  )}
                  {schedule.durationBadge && (
                    <span className="ml-0.5 rounded-[2px] px-1 py-0.2 bg-[var(--app-accent)]/20 text-[var(--app-accent-text)] font-mono text-[10px] font-semibold">
                      {schedule.durationBadge}
                    </span>
                  )}
                </span>
              )}

              {task.recurrence && task.recurrence !== "NONE" && (
                <span className="flex items-center gap-0.5 text-[var(--app-accent)] text-[11px]" title={`Repeats ${task.recurrence}`}>
                  <Repeat className="h-2.5 w-2.5" />
                  {task.recurrence.toLowerCase()}
                </span>
              )}

              {totalSubtasks > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--app-muted)]">
                  <CheckCircle2 className="h-3 w-3 text-[var(--app-accent-text)]" />
                  {completedSubtasks}/{totalSubtasks}
                </span>
              )}

              {task.pomodoroCount > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[#e03e3e] text-[11px] font-medium" title="Focus sessions">
                  🍅 {task.pomodoroCount}
                </span>
              )}

              {task.tags?.map(({ tag }) => (
                <span
                  key={tag.id}
                  className="rounded-[3px] px-1.5 py-0.5 text-[11px] font-medium border"
                  style={{ backgroundColor: `${tag.color}15`, color: tag.color, borderColor: `${tag.color}30` }}
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

  function renderGroupSection(
    groupId: string | null,
    title: string,
    groupColor: string,
    sectionTasks: Task[],
    groupObj?: TaskGroup
  ) {
    const isCollapsed = groupId ? collapsedSections[groupId] : false;
    const isDragOver = dragOverGroupId === (groupId || "ungrouped");
    const inlineValue = quickAddTitle[groupId || "ungrouped"] || "";

    return (
      <div
        key={groupId || "ungrouped"}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (dragOverGroupId !== (groupId || "ungrouped")) {
            setDragOverGroupId(groupId || "ungrouped");
          }
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragOverGroupId(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverGroupId(null);
          const draggedTaskId = e.dataTransfer.getData("text/taskId") || e.dataTransfer.getData("text/plain");
          if (draggedTaskId && onUpdateTask) {
            onUpdateTask({ taskId: draggedTaskId, groupId: groupId || null });
          }
        }}
        className={cn(
          "rounded-[6px] border border-transparent transition-colors p-2 space-y-2",
          isDragOver && "border-[var(--app-accent)] bg-[var(--app-accent-tag-bg)]"
        )}
      >
        {/* Section Header */}
        <div className="flex items-center justify-between px-1 py-1 text-[var(--app-muted)] select-none">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {groupId && (
              <button
                type="button"
                onClick={() => toggleSectionCollapse(groupId)}
                className="p-0.5 rounded hover:bg-[var(--app-panel-alt)] text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
                title={isCollapsed ? "Expand group" : "Collapse group"}
              >
                {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: groupColor }}
            />
            <span className="app-label font-bold text-[var(--app-text)] truncate">{title}</span>
            <span className="app-meta text-[var(--app-muted)] font-semibold">({sectionTasks.length})</span>
          </div>

          {groupObj && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setEditingGroup(groupObj);
                  setEditGroupName(groupObj.name);
                  setEditGroupColor(groupObj.color || "#4772fa");
                }}
                title="Edit Group"
                className="p-1 rounded text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-panel-alt)] transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setGroupToDelete(groupObj)}
                title="Delete Group"
                className="p-1 rounded text-[var(--app-muted)] hover:text-rose-400 hover:bg-[var(--app-panel-alt)] transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Section Tasks */}
        {!isCollapsed && (
          <div className="space-y-1.5 pl-1 sm:pl-2">
            {sectionTasks.length === 0 ? (
              <div className="py-2 px-3 text-xs text-[var(--app-muted)]/70 italic border border-dashed border-[var(--app-border)]/50 rounded-lg">
                No tasks in this group. Drag tasks here or use the input below.
              </div>
            ) : (
              sectionTasks.map(renderTaskItem)
            )}

            {/* Inline Add Task Row */}
            {context?.activeListId && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!inlineValue.trim() || !context?.addTask || !context?.activeListId) return;
                  await context.addTask({
                    title: inlineValue.trim(),
                    listId: context.activeListId,
                    groupId: groupId || null,
                  });
                  setQuickAddTitle((prev) => ({ ...prev, [groupId || "ungrouped"]: "" }));
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] border border-dashed border-[var(--app-border)] hover:border-[var(--app-accent)] bg-[var(--app-panel)] hover:bg-[var(--app-panel-hover)] transition-colors text-xs"
              >
                <Plus className="h-3.5 w-3.5 text-[var(--app-muted)] shrink-0" />
                <input
                  type="text"
                  value={inlineValue}
                  onChange={(e) =>
                    setQuickAddTitle((prev) => ({ ...prev, [groupId || "ungrouped"]: e.target.value }))
                  }
                  placeholder={`Add a task to ${title}...`}
                  className="flex-1 bg-transparent app-body text-xs text-[var(--app-text)] placeholder-[var(--app-muted)]/70 focus:outline-none"
                />
                {inlineValue.trim() && (
                  <button
                    type="submit"
                    className="rounded bg-[var(--app-accent)] px-2 py-0.5 app-meta font-medium text-white hover:bg-[var(--app-accent-strong)] transition-colors"
                  >
                    Add
                  </button>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  // Render grouped tasks based on groupBy setting
  function renderGroupedTasks() {
    // If a single group is active in sidebar
    if (context?.activeGroupId) {
      const activeGroup = (context?.taskGroups || []).find((g) => g.id === context?.activeGroupId);
      if (activeGroup) {
        return (
          <div className="space-y-4">
            {renderGroupSection(
              activeGroup.id,
              activeGroup.name,
              activeGroup.color || "#4772fa",
              incompleteTasks,
              activeGroup
            )}
          </div>
        );
      }
    }

    // If viewing a list and grouped by "group" or list has sections
    if (groupBy === "group" || (isCustomList && currentListGroups.length > 0 && groupBy !== "date" && groupBy !== "priority" && groupBy !== "none")) {
      const ungroupedTasks = incompleteTasks.filter(
        (t) => !t.groupId || !currentListGroups.some((g) => g.id === t.groupId)
      );

      return (
        <div className="space-y-6">
          {currentListGroups.map((group) => {
            const groupTasks = incompleteTasks.filter((t) => t.groupId === group.id);
            return renderGroupSection(
              group.id,
              group.name,
              group.color || "#4772fa",
              groupTasks,
              group
            );
          })}

          {/* Ungrouped Section: always visible for lists with groups */}
          {renderGroupSection(
            null,
            "Ungrouped",
            "#64748b",
            ungroupedTasks
          )}
        </div>
      );
    }

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
          {/* Add Group button for custom lists */}
          {isCustomList && (
            <button
              type="button"
              onClick={() => {
                setNewGroupName("");
                setShowAddGroupModal(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg app-meta font-semibold text-[var(--app-accent-text)] bg-[var(--app-accent)]/10 hover:bg-[var(--app-accent)]/20 transition-colors cursor-pointer"
              title="Add a group under this list"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>+ Add Group</span>
            </button>
          )}

          {/* Group By selector */}
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-[var(--app-muted)]" />
            <select
              value={groupBy}
              onChange={(e: any) => setGroupBy(e.target.value)}
              className="bg-transparent app-label text-[var(--app-muted)] focus:outline-none cursor-pointer"
            >
              {isCustomList && currentListGroups.length > 0 && (
                <option value="group">Group: Sections</option>
              )}
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
            {completedTasks.length > 0 && (() => {
              const wontDoCount = completedTasks.filter((t) => t.kanbanStatus === "WONT_DO").length;
              return (
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
                    <span>{wontDoCount > 0 ? "Completed & Won't Do" : "Completed"}</span>
                    <span className="rounded-full bg-[var(--app-panel-alt)] px-1.5 py-0.2 app-meta text-[var(--app-muted)]">
                      {completedTasks.length}
                    </span>
                  </button>
                  {showCompleted && (
                    <div className="space-y-1.5 pt-1">{completedTasks.map(renderTaskItem)}</div>
                  )}
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Floating Batch Actions Bar */}
      {selectedTaskIds.length > 0 && onBatchAction && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)] px-3 py-1.5 shadow-[0_8px_30px_rgba(15,15,15,0.12),0_0_0_1px_rgba(15,15,15,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2 mr-1">
            <span className="rounded-[3px] bg-[var(--app-accent)] px-1.5 py-0.2 text-xs font-semibold text-white">
              {selectedTaskIds.length}
            </span>
            <span className="text-xs text-[var(--app-text)] font-medium">Selected</span>
          </div>

          <div className="h-4 w-px bg-[var(--app-border)]" />

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={async () => {
                await onBatchAction({ taskIds: selectedTaskIds, action: "complete", value: true });
                setSelectedTaskIds([]);
              }}
              className="rounded-[4px] bg-[var(--app-accent)]/15 border border-[var(--app-accent)]/20 px-2 py-0.5 text-xs font-medium text-[var(--app-accent-text)] hover:bg-[var(--app-accent)]/25 cursor-pointer"
            >
              Complete ✓
            </button>

            <button
              type="button"
              onClick={async () => {
                await onBatchAction({ taskIds: selectedTaskIds, action: "dueDate", value: today });
                setSelectedTaskIds([]);
              }}
              className="rounded-[4px] bg-[var(--app-panel-alt)] border border-[var(--app-border)]/60 px-2 py-0.5 text-xs font-medium text-[var(--app-text)] hover:bg-[var(--app-hover)] cursor-pointer"
            >
              Set Today
            </button>

            <button
              type="button"
              onClick={async () => {
                await onBatchAction({ taskIds: selectedTaskIds, action: "priority", value: 3 });
                setSelectedTaskIds([]);
              }}
              className="rounded-[4px] bg-[#e03e3e]/15 border border-[#e03e3e]/20 px-2 py-0.5 text-xs font-medium text-[#e03e3e] hover:bg-[#e03e3e]/25 cursor-pointer"
            >
              High Priority
            </button>

            <button
              type="button"
              onClick={async () => {
                await onBatchAction({ taskIds: selectedTaskIds, action: "delete" });
                setSelectedTaskIds([]);
              }}
              className="rounded-[4px] p-1 text-[var(--app-muted)] hover:text-[#e03e3e] hover:bg-[#e03e3e]/15 cursor-pointer transition-colors"
              title="Delete selected"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedTaskIds([])}
              className="rounded-[4px] p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover)] cursor-pointer transition-colors"
              title="Cancel selection"
            >
              <X className="h-3.5 w-3.5" />
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

      {/* New Group Modal */}
      {showAddGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-xs rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)] p-4 text-[var(--app-text)] shadow-[0_8px_30px_rgba(15,15,15,0.12),0_0_0_1px_rgba(15,15,15,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)]">
            <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider text-[var(--app-text)]">New Group</h4>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newGroupName.trim() || !context?.activeListId || !context?.addTaskGroup) return;
                await context.addTaskGroup({
                  listId: context.activeListId,
                  name: newGroupName.trim(),
                  color: newGroupColor,
                });
                setNewGroupName("");
                setShowAddGroupModal(false);
              }}
              className="space-y-3"
            >
              <input
                type="text"
                required
                autoFocus
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name (e.g. Backlog, Sprint 1)"
                className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel-alt)] px-2.5 py-1.5 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/30"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--app-muted)]">Color:</span>
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewGroupColor(c)}
                    className={`h-4.5 w-4.5 rounded-full cursor-pointer ${newGroupColor === c ? "ring-2 ring-[var(--app-accent)] ring-offset-1 ring-offset-[var(--app-panel)]" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGroupModal(false)}
                  className="rounded-[4px] px-2.5 py-1 text-xs text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim()}
                  className="rounded-[4px] bg-[var(--app-accent)] px-3 py-1 text-xs font-medium text-white hover:bg-[var(--app-accent-strong)] disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-xs rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)] p-4 text-[var(--app-text)] shadow-[0_8px_30px_rgba(15,15,15,0.12),0_0_0_1px_rgba(15,15,15,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)]">
            <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider text-[var(--app-text)]">Edit Group</h4>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editingGroup || !editGroupName.trim() || !context?.updateTaskGroup) return;
                await context.updateTaskGroup({
                  id: editingGroup.id,
                  name: editGroupName.trim(),
                  color: editGroupColor,
                });
                setEditingGroup(null);
              }}
              className="space-y-3"
            >
              <input
                type="text"
                required
                autoFocus
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel-alt)] px-2.5 py-1.5 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/30"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--app-muted)]">Color:</span>
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditGroupColor(c)}
                    className={`h-4.5 w-4.5 rounded-full cursor-pointer ${editGroupColor === c ? "ring-2 ring-[var(--app-accent)] ring-offset-1 ring-offset-[var(--app-panel)]" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="rounded-[4px] px-2.5 py-1 text-xs text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[4px] bg-[var(--app-accent)] px-3 py-1 text-xs font-medium text-white hover:bg-[var(--app-accent-strong)] cursor-pointer shadow-xs"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Dialog */}
      <DeleteConfirmDialog
        open={Boolean(groupToDelete)}
        onOpenChange={(open) => !open && setGroupToDelete(null)}
        title="Delete Group"
        description={`Are you sure you want to delete group "${groupToDelete?.name}"? All tasks inside this group will be preserved in this list as ungrouped tasks.`}
        onConfirm={async () => {
          if (groupToDelete && context?.deleteTaskGroup) {
            const target = groupToDelete;
            setGroupToDelete(null);
            await context.deleteTaskGroup(target.id);
          }
        }}
      />
    </div>
  );
}
