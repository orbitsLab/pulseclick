"use client";

import React from "react";
import { Plus, Check, Calendar, CheckCircle2 } from "lucide-react";
import { Task } from "@/hooks/use-ticktick";
import { formatShortDate, getTodayISO } from "@/lib/date-utils";

interface TaskKanbanViewProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: "TODO" | "IN_PROGRESS" | "DONE") => void;
  onQuickAdd: (status: "TODO" | "IN_PROGRESS" | "DONE") => void;
}

export function TaskKanbanView({
  tasks,
  selectedTaskId,
  onSelectTask,
  onUpdateStatus,
  onQuickAdd,
}: TaskKanbanViewProps) {
  const today = getTodayISO();

  const columns: { id: "TODO" | "IN_PROGRESS" | "DONE"; label: string; color: string }[] = [
    { id: "TODO", label: "To Do", color: "border-[var(--tt-border)]" },
    { id: "IN_PROGRESS", label: "In Progress", color: "border-amber-400" },
    { id: "DONE", label: "Completed", color: "border-[var(--tt-accent)]" },
  ];

  function getPriorityDot(priority: number) {
    switch (priority) {
      case 3:
        return "bg-rose-500";
      case 2:
        return "bg-amber-500";
      case 1:
        return "bg-blue-400";
      default:
        return "bg-transparent";
    }
  }

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => {
          if (col.id === "DONE") return t.completed || t.kanbanStatus === "DONE";
          if (col.id === "IN_PROGRESS") return !t.completed && t.kanbanStatus === "IN_PROGRESS";
          return !t.completed && (t.kanbanStatus === "TODO" || !t.kanbanStatus);
        });

        return (
          <div
            key={col.id}
            className="flex flex-col rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel-alt)]/60 p-3 min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--tt-border)]">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${col.color.replace("border-", "bg-")}`} />
                <h3 className="tt-overline font-semibold text-[var(--tt-text)]">
                  {col.label}
                </h3>
                <span className="rounded-full bg-[var(--tt-panel-alt)] px-1.5 py-0.2 tt-meta font-bold text-[var(--tt-text)]">
                  {colTasks.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onQuickAdd(col.id)}
                title="Add task to column"
                className="rounded p-1 text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)] hover:text-[var(--tt-text)]"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Task Cards in Column */}
            <div className="flex-1 space-y-2.5 overflow-y-auto">
              {colTasks.map((task) => {
                const isSelected = selectedTaskId === task.id;
                const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
                const totalSubtasks = task.subtasks?.length || 0;

                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task.id)}
                    className={`rounded-xl border p-3 cursor-pointer transition-all shadow-xs ${ isSelected ? "border-[var(--tt-accent)] bg-[var(--tt-accent)]/10 ring-1 ring-[var(--tt-accent)]" : "border-[var(--tt-border)] bg-[var(--tt-panel)] hover:border-[var(--tt-border)]" }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`flex items-start gap-1.5 tt-heading font-semibold ${ task.completed ? "line-through text-[var(--tt-muted)]" : "text-[var(--tt-text)]" }`}
                      >
                        {/* Priority reads as a dot, not a stripe down the card edge. */}
                        <span
                          aria-hidden="true"
                          className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${getPriorityDot(task.priority)}`}
                        />
                        <span className="min-w-0">{task.title}</span>
                      </h4>
                    </div>

                    {/* Metadata: List, Subtasks, Due Date */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 tt-meta text-[var(--tt-muted)]">
                      <div className="flex items-center gap-1.5">
                        {task.list && (
                          <span
                            className="font-medium"
                            style={{ color: task.list.color }}
                          >
                            {task.list.name}
                          </span>
                        )}
                        {totalSubtasks > 0 && (
                          <span className="flex items-center gap-0.5 text-[var(--tt-accent-text)] font-semibold">
                            <CheckCircle2 className="h-3 w-3" />
                            {completedSubtasks}/{totalSubtasks}
                          </span>
                        )}
                      </div>

                      {task.dueDate && (
                        <span
                          className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 ${ task.dueDate === today ? "bg-[var(--tt-accent)]/15 text-[var(--tt-accent-text)] font-bold" : "bg-[var(--tt-panel-alt)] text-[var(--tt-muted)] dark:bg-[var(--tt-panel-alt)]" }`}
                        >
                          <Calendar className="h-2.5 w-2.5" />
                          {task.dueDate === today ? "Today" : formatShortDate(task.dueDate)}
                        </span>
                      )}
                    </div>

                    {/* Column transition buttons */}
                    <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-[var(--tt-border)] pt-2">
                      {col.id !== "TODO" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(task.id, "TODO");
                          }}
                          className="rounded px-1.5 py-0.5 tt-meta font-semibold text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)]"
                        >
                          ← To Do
                        </button>
                      )}
                      {col.id !== "IN_PROGRESS" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(task.id, "IN_PROGRESS");
                          }}
                          className="rounded px-1.5 py-0.5 tt-meta font-semibold text-amber-500 hover:bg-amber-500/10"
                        >
                          In Progress
                        </button>
                      )}
                      {col.id !== "DONE" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(task.id, "DONE");
                          }}
                          className="rounded px-1.5 py-0.5 tt-meta font-semibold text-[var(--tt-accent-text)] hover:bg-[var(--tt-accent-strong)]/10"
                        >
                          Done ✓
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
