"use client";

import React, { ComponentProps, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/reui/badge";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
  type KanbanCommitMeta,
} from "@/components/reui/kanban";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GripVerticalIcon,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { Task } from "@/hooks/use-ticktick";
import { formatShortDate, getTodayISO, addDays } from "@/lib/date-utils";
import { useTickTickContext } from "@/context/ticktick-context";
import { cn } from "@/lib/utils";

const COLUMN_CONFIG: Record<
  string,
  {
    title: string;
    dotColor: string;
  }
> = {
  TODO: {
    title: "To Do",
    dotColor: "bg-slate-400",
  },
  IN_PROGRESS: {
    title: "In Progress",
    dotColor: "bg-amber-500",
  },
  DONE: {
    title: "Done",
    dotColor: "bg-emerald-500",
  },
};

function groupTasksByColumn(taskList: Task[]): Record<string, Task[]> {
  const activeTasks = (taskList || []).filter((t) => !t.isTrash);
  return {
    TODO: activeTasks.filter(
      (t) => !t.completed && (t.kanbanStatus === "TODO" || !t.kanbanStatus)
    ),
    IN_PROGRESS: activeTasks.filter(
      (t) => !t.completed && t.kanbanStatus === "IN_PROGRESS"
    ),
    DONE: activeTasks.filter((t) => t.completed || t.kanbanStatus === "DONE"),
  };
}

interface TaskCardProps extends Omit<
  ComponentProps<typeof KanbanItem>,
  "value" | "children"
> {
  task: Task;
  asHandle?: boolean;
  isOverlay?: boolean;
  isSelected?: boolean;
  today: string;
  onSelect?: () => void;
  onToggleComplete?: (completed: boolean) => void;
  onMoveStatus?: (status: "TODO" | "IN_PROGRESS" | "DONE") => void;
  onToggleSubtask?: (taskId: string, subtaskId: string, completed: boolean) => void;
}

function TaskCard({
  task,
  asHandle,
  isOverlay,
  isSelected,
  today,
  onSelect,
  onToggleComplete,
  onMoveStatus,
  onToggleSubtask,
  ...props
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const completedSubtasks =
    task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const currentStatus = useMemo(() => {
    if (task.completed) return "DONE";
    if (task.kanbanStatus === "IN_PROGRESS") return "IN_PROGRESS";
    if (task.kanbanStatus === "DONE") return "DONE";
    return "TODO";
  }, [task.completed, task.kanbanStatus]);

  const isOverdue = useMemo(() => {
    if (!task.dueDate || task.completed) return false;
    return task.dueDate < today;
  }, [task.dueDate, task.completed, today]);

  const tomorrow = useMemo(() => addDays(today, 1), [today]);

  // Priority and completion card styling
  const priorityCardStyles = useMemo(() => {
    if (task.completed) {
      return "bg-[var(--tt-panel-alt)]/50 border-[var(--tt-border)]/60 text-[var(--tt-muted)]";
    }
    if (task.priority === 3) {
      return "border-rose-500/35 bg-rose-500/10 hover:bg-rose-500/15";
    }
    if (task.priority === 2) {
      return "border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/15";
    }
    if (task.priority === 1) {
      return "border-sky-500/35 bg-sky-500/10 hover:bg-sky-500/15";
    }
    return "border-[var(--tt-border)] bg-[var(--tt-panel)] hover:border-[var(--tt-border)]/80";
  }, [task.completed, task.priority]);

  const cardContent = (
    <Card
      size="sm"
      onClick={onSelect}
      className={cn(
        "group/card flex flex-col gap-2 rounded-xl border p-2.5 text-left transition-all",
        priorityCardStyles,
        asHandle && !isOverlay && "cursor-grab active:cursor-grabbing",
        isSelected &&
          "ring-2 ring-[var(--tt-accent)] border-[var(--tt-accent)] shadow-sm",
        isOverlay &&
          "rotate-1 shadow-2xl border-[var(--tt-accent)] ring-2 ring-[var(--tt-accent)]/30 cursor-grabbing",
        !isSelected &&
          !isOverlay &&
          "hover:shadow-xs"
      )}
    >
      <CardContent className="flex flex-col gap-2 p-0">
        {/* Top Header: Checkbox + Title + Priority Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete?.(!task.completed);
              }}
              className="text-[var(--tt-muted)] hover:text-emerald-500 transition-colors mt-0.5 shrink-0 cursor-pointer"
              title={task.completed ? "Mark incomplete" : "Mark complete"}
            >
              {task.completed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/10" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </button>
            <span
              className={cn(
                "line-clamp-2 tt-heading font-semibold text-[var(--tt-text)] flex-1",
                task.completed &&
                  "line-through opacity-60 text-[var(--tt-muted)]"
              )}
            >
              {task.title}
            </span>
          </div>

          {/* Priority Badge */}
          {task.priority === 3 && (
            <Badge
              variant="destructive-outline"
              className="pointer-events-none h-5 shrink-0 rounded-md px-1.5 tt-meta font-semibold"
            >
              High
            </Badge>
          )}
          {task.priority === 2 && (
            <Badge
              variant="warning-outline"
              className="pointer-events-none h-5 shrink-0 rounded-md px-1.5 tt-meta font-semibold"
            >
              Medium
            </Badge>
          )}
          {task.priority === 1 && (
            <Badge
              variant="primary-outline"
              className="pointer-events-none h-5 shrink-0 rounded-md px-1.5 tt-meta font-semibold"
            >
              Low
            </Badge>
          )}
        </div>

        {/* Task Description */}
        {task.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-[var(--tt-muted)] tt-body pl-6">
            {task.description}
          </p>
        )}

        {/* Expandable Subtask List */}
        {totalSubtasks > 0 && (
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              isExpanded
                ? "max-h-96 opacity-100 mt-1 pt-1 pb-0.5 border-t border-[var(--tt-border)]/40"
                : "max-h-0 opacity-0"
            )}
          >
            <div className="flex flex-col gap-1 pl-6">
              {task.subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSubtask?.(task.id, st.id, !st.completed);
                  }}
                  className="group/subtask flex items-center gap-2 py-0.5 px-1 rounded hover:bg-[var(--tt-panel-alt)]/60 transition-colors cursor-pointer"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSubtask?.(task.id, st.id, !st.completed);
                    }}
                    className={cn(
                      "flex h-3.5 w-3.5 items-center justify-center rounded border transition-all mt-0.5 shrink-0 cursor-pointer",
                      st.completed
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-[var(--tt-border)] hover:border-[var(--tt-accent)] text-transparent"
                    )}
                    title={st.completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {st.completed && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </button>
                  <span
                    className={cn(
                      "tt-body text-xs text-[var(--tt-text)] flex-1 min-w-0 truncate select-none",
                      st.completed && "line-through text-[var(--tt-muted)] opacity-60"
                    )}
                  >
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unified Bottom Row: List, Date, Tags, Subtasks expander, Assignee + Status Actions */}
        <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-[var(--tt-border)]/60 tt-meta text-[var(--tt-muted)]">
          {/* Left: Metadata chips */}
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            {/* List */}
            {task.list && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 tt-meta font-medium bg-[var(--tt-panel-alt)] border border-[var(--tt-border)]/80 shrink-0"
                style={{ color: task.list.color || undefined }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: task.list.color || "var(--tt-accent)",
                  }}
                />
                <span className="truncate max-w-24">{task.list.name}</span>
              </span>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <div
                className={cn(
                  "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium tabular-nums tt-meta shrink-0",
                  isOverdue
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold"
                    : task.dueDate === today
                    ? "bg-[var(--tt-accent)]/15 text-[var(--tt-accent-text)] font-bold border border-[var(--tt-accent)]/30"
                    : task.dueDate === tomorrow
                    ? "bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30"
                    : "bg-[var(--tt-panel-alt)] text-[var(--tt-muted)] border border-[var(--tt-border)]/60"
                )}
              >
                <Calendar className="h-2.5 w-2.5 shrink-0" />
                <time className="whitespace-nowrap">
                  {task.dueDate === today
                    ? "Today"
                    : task.dueDate === tomorrow
                    ? "Tomorrow"
                    : formatShortDate(task.dueDate)}
                  {task.dueTime && ` · ${task.dueTime}`}
                </time>
              </div>
            )}

            {/* Tags */}
            {task.tags &&
              task.tags.map((t) => (
                <span
                  key={t.tag?.id || t.tagId}
                  className="inline-flex items-center rounded px-1.5 py-0.5 tt-meta text-[var(--tt-muted)] bg-[var(--tt-panel-alt)]/60 border border-[var(--tt-border)]/50 shrink-0"
                >
                  #{t.tag?.name || "tag"}
                </span>
              ))}

            {/* Subtasks expand toggle pill */}
            {totalSubtasks > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded((prev) => !prev);
                }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 tt-meta font-medium transition-colors cursor-pointer shrink-0",
                  isExpanded
                    ? "bg-[var(--tt-accent)]/20 text-[var(--tt-accent-text)] border border-[var(--tt-accent)]/40"
                    : "bg-[var(--tt-panel-alt)] text-[var(--tt-muted)] hover:text-[var(--tt-text)] border border-[var(--tt-border)]/70"
                )}
                title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                <span>
                  {completedSubtasks}/{totalSubtasks}
                </span>
                <ChevronDown
                  className={cn(
                    "h-2.5 w-2.5 transition-transform duration-300",
                    isExpanded && "rotate-180"
                  )}
                />
              </button>
            )}

            {/* Assignees */}
            {task.assignees && task.assignees.length > 0 && (
              <div className="flex -space-x-1 shrink-0">
                {task.assignees.slice(0, 2).map((a, i) => {
                  const name = a.member?.displayName || a.member?.email || "?";
                  return (
                    <Avatar key={i} className="size-4 border border-[var(--tt-panel)]">
                      <AvatarFallback className="tt-meta bg-[var(--tt-panel-alt)] text-[var(--tt-text)] font-semibold">
                        {name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Quick column transition buttons (<- To Do, Progress ->) */}
          {!isOverlay && onMoveStatus && (
            <div className="flex items-center gap-1 shrink-0">
              {currentStatus !== "TODO" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveStatus("TODO");
                  }}
                  className="rounded px-1.5 py-0.5 tt-meta font-medium text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)] hover:text-[var(--tt-text)] transition-colors flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                  title="Move to To Do"
                >
                  <ArrowLeft className="h-2.5 w-2.5" /> To Do
                </button>
              )}
              {currentStatus !== "IN_PROGRESS" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveStatus("IN_PROGRESS");
                  }}
                  className="rounded px-1.5 py-0.5 tt-meta font-medium text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                  title="Move to In Progress"
                >
                  In Progress
                </button>
              )}
              {currentStatus !== "DONE" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveStatus("DONE");
                  }}
                  className="rounded px-1.5 py-0.5 tt-meta font-medium text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                  title="Move to Done"
                >
                  Done <ArrowRight className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <KanbanItem value={task.id} {...props}>
      {asHandle && !isOverlay ? (
        <KanbanItemHandle>{cardContent}</KanbanItemHandle>
      ) : (
        cardContent
      )}
    </KanbanItem>
  );
}

export function KanbanColumnSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2.5 p-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-xl border border-[var(--tt-border)]/60 bg-[var(--tt-panel)]/40 p-2.5"
          style={{ opacity: Math.max(0.35, 1 - i * 0.25) }}
        >
          {/* Header: Checkbox + Title + Priority */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Skeleton className="h-4 w-4 rounded-full shrink-0 bg-[var(--tt-panel-alt)]" />
              <Skeleton
                className="h-4 rounded bg-[var(--tt-panel-alt)]"
                style={{ width: `${Math.max(40, 75 - i * 15)}%` }}
              />
            </div>
            <Skeleton className="h-4.5 w-10 rounded-md bg-[var(--tt-panel-alt)]/70 shrink-0" />
          </div>

          {/* Description line placeholder */}
          <Skeleton className="h-3 rounded w-1/2 bg-[var(--tt-panel-alt)]/50 ml-6" />

          {/* Bottom metadata row */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--tt-border)]/40">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-4 w-16 rounded bg-[var(--tt-panel-alt)]/60" />
              <Skeleton className="h-4 w-14 rounded bg-[var(--tt-panel-alt)]/60" />
            </div>
            <Skeleton className="h-4 w-16 rounded bg-[var(--tt-panel-alt)]/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface TaskColumnProps extends Omit<
  ComponentProps<typeof KanbanColumn>,
  "children"
> {
  tasks: Task[];
  isOverlay?: boolean;
  isLoading?: boolean;
  selectedTaskId: string | null;
  today: string;
  onSelectTask: (taskId: string) => void;
  onQuickAdd: (status: "TODO" | "IN_PROGRESS" | "DONE") => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onMoveStatus: (taskId: string, status: "TODO" | "IN_PROGRESS" | "DONE") => void;
  onToggleSubtask?: (taskId: string, subtaskId: string, completed: boolean) => void;
}

function TaskColumn({
  value,
  tasks,
  isOverlay,
  isLoading,
  selectedTaskId,
  today,
  onSelectTask,
  onQuickAdd,
  onToggleComplete,
  onMoveStatus,
  onToggleSubtask,
  ...props
}: TaskColumnProps) {
  const config = COLUMN_CONFIG[value] || {
    title: value,
    dotColor: "bg-slate-400",
  };

  return (
    <KanbanColumn
      value={value}
      {...props}
      className={cn(
        "flex flex-col min-w-[280px] flex-1 h-full min-h-0",
        isOverlay && "opacity-90 rotate-0.5 shadow-2xl cursor-grabbing"
      )}
    >
      <Card className="flex flex-col h-full rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel-alt)]/40 p-3 shadow-xs min-h-0 overflow-hidden">
        <CardHeader className="flex items-center justify-between pb-3 mb-2.5 border-b border-[var(--tt-border)]/80 p-0 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={cn("h-2.5 w-2.5 rounded-full shrink-0", config.dotColor)}
            />
            <span className="tt-heading font-semibold text-[var(--tt-text)]">
              {config.title}
            </span>
            <Badge
              variant="outline"
              className="border-[var(--tt-border)] bg-[var(--tt-panel)] text-[var(--tt-muted)] h-5 px-1.5 tt-meta font-bold rounded-md"
            >
              {tasks.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() =>
                onQuickAdd(value as "TODO" | "IN_PROGRESS" | "DONE")
              }
              className="text-[var(--tt-muted)] hover:text-[var(--tt-text)] hover:bg-[var(--tt-panel)] cursor-pointer"
              title={`Add task to ${config.title}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <KanbanColumnHandle
              render={(handleProps) => (
                <Button
                  {...handleProps}
                  size="icon-xs"
                  variant="ghost"
                  className="text-[var(--tt-muted)] hover:text-[var(--tt-text)] hover:bg-[var(--tt-panel)] cursor-grab active:cursor-grabbing"
                  title="Drag column"
                >
                  <GripVerticalIcon className="h-3.5 w-3.5" />
                </Button>
              )}
            />
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col p-0 overflow-hidden min-h-0 -mr-2">
          <ScrollArea className="flex-1 h-full min-h-0">
            <KanbanColumnContent
              value={value}
              className="flex flex-col gap-2.5 min-h-[160px] pl-0.5 pr-3.5 pt-0.5 pb-3"
            >
              {isLoading && tasks.length === 0 ? (
                <KanbanColumnSkeleton count={2} />
              ) : tasks.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--tt-border)]/60 p-6 text-center tt-meta text-[var(--tt-muted)] min-h-[140px] gap-2">
                  <span>No tasks in {config.title}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      onQuickAdd(value as "TODO" | "IN_PROGRESS" | "DONE")
                    }
                    className="h-7 text-xs text-[var(--tt-accent-text)] hover:text-[var(--tt-accent-text)] hover:bg-[var(--tt-accent)]/10 cursor-pointer"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add task
                  </Button>
                </div>
              ) : (
                tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    asHandle={!isOverlay}
                    isOverlay={isOverlay}
                    isSelected={selectedTaskId === task.id}
                    today={today}
                    onSelect={() => onSelectTask(task.id)}
                    onToggleComplete={(completed) =>
                      onToggleComplete(task.id, completed)
                    }
                    onMoveStatus={(status) => onMoveStatus(task.id, status)}
                    onToggleSubtask={onToggleSubtask}
                  />
                ))
              )}
            </KanbanColumnContent>
          </ScrollArea>
        </CardContent>
      </Card>
    </KanbanColumn>
  );
}

interface TaskKanbanViewProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onUpdateStatus: (
    taskId: string,
    status: "TODO" | "IN_PROGRESS" | "DONE"
  ) => void;
  onQuickAdd: (status: "TODO" | "IN_PROGRESS" | "DONE") => void;
}

export function TaskKanbanView({
  tasks,
  selectedTaskId,
  onSelectTask,
  onUpdateStatus,
  onQuickAdd,
}: TaskKanbanViewProps) {
  const context = useTickTickContext();
  const today = getTodayISO();

  // Initialize and synchronize columns from live tasks
  const [columns, setColumns] = useState<Record<string, Task[]>>(() =>
    groupTasksByColumn(tasks)
  );

  useEffect(() => {
    setColumns(groupTasksByColumn(tasks));
  }, [tasks]);

  const handleToggleComplete = (taskId: string, completed: boolean) => {
    const nextStatus = completed ? "DONE" : "TODO";
    onUpdateStatus(taskId, nextStatus);
    if (context.toggleComplete) {
      context.toggleComplete({ taskId, completed });
    }
  };

  const handleMoveStatus = (
    taskId: string,
    status: "TODO" | "IN_PROGRESS" | "DONE"
  ) => {
    onUpdateStatus(taskId, status);
  };

  const handleToggleSubtask = (
    taskId: string,
    subtaskId: string,
    completed: boolean
  ) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;
    const nextSubtasks = (targetTask.subtasks || []).map((s) =>
      s.id === subtaskId ? { ...s, completed } : s
    );
    context?.updateTask?.({ taskId, subtasks: nextSubtasks });
  };

  const handleValueCommit = (
    _finalValue: Record<string, Task[]>,
    meta: KanbanCommitMeta<Task>
  ) => {
    if (meta.kind === "item" && meta.activeContainer !== meta.overContainer) {
      const taskId = String(meta.event.active.id);
      const newStatus = meta.overContainer as "TODO" | "IN_PROGRESS" | "DONE";
      onUpdateStatus(taskId, newStatus);
    }
  };

  const isInitialLoading =
    (context?.isInitialLoadingTasks || (context?.isLoadingTasks && !context?.hasLoadedTasksOnce)) &&
    tasks.length === 0;

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col">
      <Kanban
        value={columns}
        onValueChange={setColumns}
        onValueCommit={handleValueCommit}
        getItemValue={(item) => item.id}
        className="flex-1 h-full overflow-hidden flex flex-col"
      >
        <KanbanBoard className="grid h-full auto-rows-fr grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto md:overflow-hidden pb-4 min-h-0">
          {Object.entries(columns).map(([columnValue, colTasks]) => (
            <TaskColumn
              key={columnValue}
              value={columnValue}
              tasks={colTasks}
              isLoading={isInitialLoading}
              selectedTaskId={selectedTaskId}
              today={today}
              onSelectTask={onSelectTask}
              onQuickAdd={onQuickAdd}
              onToggleComplete={handleToggleComplete}
              onMoveStatus={handleMoveStatus}
              onToggleSubtask={handleToggleSubtask}
            />
          ))}
        </KanbanBoard>

        <KanbanOverlay>
          {({ value, variant }) => {
            if (variant === "column") {
              const colTasks = columns[String(value)] ?? [];
              return (
                <TaskColumn
                  value={String(value)}
                  tasks={colTasks}
                  selectedTaskId={selectedTaskId}
                  today={today}
                  onSelectTask={onSelectTask}
                  onQuickAdd={onQuickAdd}
                  onToggleComplete={handleToggleComplete}
                  onMoveStatus={handleMoveStatus}
                  onToggleSubtask={handleToggleSubtask}
                  isOverlay
                />
              );
            }

            const task = Object.values(columns)
              .flat()
              .find((t) => t.id === value);

            if (!task) return null;

            return (
              <TaskCard
                task={task}
                today={today}
                isOverlay
              />
            );
          }}
        </KanbanOverlay>
      </Kanban>
    </div>
  );
}
