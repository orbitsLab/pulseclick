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
import {
  GripVerticalIcon,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Task } from "@/hooks/use-ticktick";
import { formatShortDate, getTodayISO } from "@/lib/date-utils";
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
  ...props
}: TaskCardProps) {
  const completedSubtasks =
    task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const isOverdue = useMemo(() => {
    if (!task.dueDate || task.completed) return false;
    return task.dueDate < today;
  }, [task.dueDate, task.completed, today]);

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
        "group/card flex flex-col gap-2.5 rounded-xl border p-3 text-left transition-all",
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
      <CardContent className="flex flex-col gap-2.5 p-0">
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

        {/* List & Tags */}
        {(task.list || (task.tags && task.tags.length > 0)) && (
          <div className="flex flex-wrap items-center gap-1.5 pl-6 pt-0.5">
            {task.list && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 tt-meta font-medium bg-[var(--tt-panel-alt)] border border-[var(--tt-border)]/80"
                style={{ color: task.list.color || undefined }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: task.list.color || "var(--tt-accent)",
                  }}
                />
                <span className="truncate max-w-28">{task.list.name}</span>
              </span>
            )}
            {task.tags &&
              task.tags.map((t) => (
                <span
                  key={t.tag?.id || t.tagId}
                  className="inline-flex items-center rounded px-1.5 py-0.5 tt-meta text-[var(--tt-muted)] bg-[var(--tt-panel-alt)]/60 border border-[var(--tt-border)]/50"
                >
                  #{t.tag?.name || "tag"}
                </span>
              ))}
          </div>
        )}

        {/* Bottom Metadata: Assignees, Subtasks, Due Date */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--tt-border)]/60 tt-meta text-[var(--tt-muted)]">
          <div className="flex items-center gap-2">
            {/* Assignees */}
            {task.assignees && task.assignees.length > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex -space-x-1.5">
                  {task.assignees.slice(0, 3).map((a, i) => {
                    const name = a.member?.displayName || a.member?.email || "?";
                    return (
                      <Avatar
                        key={i}
                        className="size-4.5 border border-[var(--tt-panel)]"
                      >
                        <AvatarFallback className="tt-meta bg-[var(--tt-panel-alt)] text-[var(--tt-text)] font-semibold">
                          {name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })}
                </div>
                {task.assignees[0]?.member && (
                  <span className="line-clamp-1 max-w-20">
                    {task.assignees[0].member.displayName || task.assignees[0].member.email}
                  </span>
                )}
              </div>
            )}

            {/* Subtasks Progress */}
            {totalSubtasks > 0 && (
              <span
                className="flex items-center gap-1 text-[var(--tt-accent-text)] font-semibold"
                title={`${completedSubtasks} of ${totalSubtasks} subtasks completed`}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </span>
            )}
          </div>

          {/* Due Date */}
          {task.dueDate && (
            <div
              className={cn(
                "flex items-center gap-1 rounded px-1.5 py-0.5 font-medium tabular-nums tt-meta",
                isOverdue
                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold"
                  : task.dueDate === today
                  ? "bg-[var(--tt-accent)]/15 text-[var(--tt-accent-text)] font-bold border border-[var(--tt-accent)]/30"
                  : "bg-[var(--tt-panel-alt)] text-[var(--tt-muted)] border border-[var(--tt-border)]/60"
              )}
            >
              <Calendar className="h-2.5 w-2.5" />
              <time className="whitespace-nowrap">
                {task.dueDate === today ? "Today" : formatShortDate(task.dueDate)}
                {task.dueTime && ` · ${task.dueTime}`}
              </time>
            </div>
          )}
        </div>

        {/* Quick status transition buttons on hover */}
        {!isOverlay && onMoveStatus && (
          <div className="flex items-center justify-end gap-1 pt-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
            {task.kanbanStatus !== "TODO" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveStatus("TODO");
                }}
                className="rounded px-1.5 py-0.5 tt-meta font-medium text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)] hover:text-[var(--tt-text)] transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                <ArrowLeft className="h-2.5 w-2.5" /> To Do
              </button>
            )}
            {task.kanbanStatus !== "IN_PROGRESS" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveStatus("IN_PROGRESS");
                }}
                className="rounded px-1.5 py-0.5 tt-meta font-medium text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
              >
                In Progress
              </button>
            )}
            {task.kanbanStatus !== "DONE" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveStatus("DONE");
                }}
                className="rounded px-1.5 py-0.5 tt-meta font-medium text-emerald-500 hover:bg-emerald-500/10 transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                Done <ArrowRight className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        )}
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

interface TaskColumnProps extends Omit<
  ComponentProps<typeof KanbanColumn>,
  "children"
> {
  tasks: Task[];
  isOverlay?: boolean;
  selectedTaskId: string | null;
  today: string;
  onSelectTask: (taskId: string) => void;
  onQuickAdd: (status: "TODO" | "IN_PROGRESS" | "DONE") => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onMoveStatus: (taskId: string, status: "TODO" | "IN_PROGRESS" | "DONE") => void;
}

function TaskColumn({
  value,
  tasks,
  isOverlay,
  selectedTaskId,
  today,
  onSelectTask,
  onQuickAdd,
  onToggleComplete,
  onMoveStatus,
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
        "flex flex-col min-w-[280px] flex-1",
        isOverlay && "opacity-90 rotate-0.5 shadow-2xl cursor-grabbing"
      )}
    >
      <Card className="flex flex-col h-full rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel-alt)]/40 p-3 shadow-xs">
        <CardHeader className="flex items-center justify-between pb-3 mb-2.5 border-b border-[var(--tt-border)]/80 p-0">
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

        <CardContent className="flex flex-1 flex-col p-0 overflow-hidden">
          <KanbanColumnContent
            value={value}
            className="flex flex-1 flex-col gap-2.5 overflow-y-auto min-h-[160px] p-0.5 pr-1"
          >
            {tasks.length === 0 ? (
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
                />
              ))
            )}
          </KanbanColumnContent>
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
    if (context.toggleComplete) {
      context.toggleComplete({ taskId, completed });
    } else {
      onUpdateStatus(taskId, completed ? "DONE" : "TODO");
    }
  };

  const handleMoveStatus = (
    taskId: string,
    status: "TODO" | "IN_PROGRESS" | "DONE"
  ) => {
    onUpdateStatus(taskId, status);
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

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col">
      <Kanban
        value={columns}
        onValueChange={setColumns}
        onValueCommit={handleValueCommit}
        getItemValue={(item) => item.id}
        className="flex-1 h-full overflow-hidden flex flex-col"
      >
        <KanbanBoard className="grid h-full auto-rows-fr grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto pb-4">
          {Object.entries(columns).map(([columnValue, colTasks]) => (
            <TaskColumn
              key={columnValue}
              value={columnValue}
              tasks={colTasks}
              selectedTaskId={selectedTaskId}
              today={today}
              onSelectTask={onSelectTask}
              onQuickAdd={onQuickAdd}
              onToggleComplete={handleToggleComplete}
              onMoveStatus={handleMoveStatus}
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
