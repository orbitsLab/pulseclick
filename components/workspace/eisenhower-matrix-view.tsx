"use client";

import React, { useState } from "react";
import { Plus, Check, Calendar, CheckCircle2 } from "lucide-react";
import { Task } from "@/hooks/use-workspace";
import { getTodayISO } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";

interface EisenhowerMatrixViewProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onAddTask: (task: { title: string; priority: number; dueDate?: string | null }) => Promise<any>;
  isLoading?: boolean;
}

export function EisenhowerMatrixView({
  tasks,
  selectedTaskId,
  onSelectTask,
  onToggleComplete,
  onAddTask,
  isLoading,
}: EisenhowerMatrixViewProps) {
  const today = getTodayISO();
  const [quickInput, setQuickInput] = useState<{ [quad: string]: string }>({});

  // Classify incomplete tasks into the 4 quadrants based on Priority (Important) & Due Date (Urgent)
  const incompleteTasks = tasks.filter((t) => !t.completed);

  // Q1: Urgent & Important (High Priority + Due Today or Overdue)
  const q1Tasks = incompleteTasks.filter(
    (t) => t.priority === 3 || (t.priority === 2 && t.dueDate && t.dueDate <= today)
  );

  // Q2: Not Urgent & Important (Medium Priority or High Priority with future/no date)
  const q2Tasks = incompleteTasks.filter(
    (t) =>
      !q1Tasks.includes(t) &&
      (t.priority === 2 || (t.priority === 3 && (!t.dueDate || t.dueDate > today)))
  );

  // Q3: Urgent & Not Important (Low Priority + Due Today or soon)
  const q3Tasks = incompleteTasks.filter(
    (t) => !q1Tasks.includes(t) && !q2Tasks.includes(t) && (t.priority === 1 || (t.dueDate && t.dueDate <= today))
  );

  // Q4: Neither (None Priority / No urgent date)
  const q4Tasks = incompleteTasks.filter(
    (t) => !q1Tasks.includes(t) && !q2Tasks.includes(t) && !q3Tasks.includes(t)
  );

  const quadrants = [
    {
      id: "q1",
      title: "Urgent & Important",
      subtitle: "Do First • Crises & Deadlines",
      color: "border-rose-500/60 bg-rose-500/5 text-rose-500",
      accent: "#ef4444",
      tasks: q1Tasks,
      defaultPriority: 3,
      defaultDueDate: today,
    },
    {
      id: "q2",
      title: "Not Urgent & Important",
      subtitle: "Schedule • Strategic Planning & Growth",
      color: "border-amber-500/60 bg-amber-500/5 text-amber-500",
      accent: "#f59e0b",
      tasks: q2Tasks,
      defaultPriority: 2,
      defaultDueDate: null,
    },
    {
      id: "q3",
      title: "Urgent & Not Important",
      subtitle: "Delegate • Interruptions & Busywork",
      color: "border-blue-500/60 bg-blue-500/5 text-blue-400",
      accent: "#3b82f6",
      tasks: q3Tasks,
      defaultPriority: 1,
      defaultDueDate: today,
    },
    {
      id: "q4",
      title: "Not Urgent & Not Important",
      subtitle: "Eliminate • Distractions & Time Wasters",
      color: "border-[var(--app-border)]/60 bg-[var(--app-panel-alt)]/5 text-[var(--app-muted)]",
      accent: "#94a3b8",
      tasks: q4Tasks,
      defaultPriority: 0,
      defaultDueDate: null,
    },
  ];

  async function handleQuickAdd(quadId: string, priority: number, dueDate?: string | null) {
    const text = (quickInput[quadId] || "").trim();
    if (!text) return;

    await onAddTask({
      title: text,
      priority,
      dueDate,
    });

    setQuickInput((prev) => ({ ...prev, [quadId]: "" }));
  }

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
      {quadrants.map((quad) => (
        <div
          key={quad.id}
          className={`flex flex-col rounded-2xl border-2 p-3.5 sm:p-4 transition-all ${quad.color} dark:bg-[var(--app-rail)]/60 min-h-[300px]`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-current/20">
            <div>
              <h3 className="app-overline font-semibold">{quad.title}</h3>
              <p className="app-meta opacity-80">{quad.subtitle}</p>
            </div>
            <span className="rounded-full px-2 py-0.5 app-label font-semibold bg-current/10">
              {quad.tasks.length}
            </span>
          </div>

          {/* Quick Input Form */}
          <div className="flex items-center gap-1.5 mb-3">
            <input
              type="text"
              value={quickInput[quad.id] || ""}
              onChange={(e) => setQuickInput({ ...quickInput, [quad.id]: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleQuickAdd(quad.id, quad.defaultPriority, quad.defaultDueDate);
                }
              }}
              placeholder="+ Add task to this quadrant..."
              className="flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1.5 app-label text-[var(--app-text)] placeholder-[var(--app-muted)] focus:outline-none focus:border-current"
            />
            <button
              type="button"
              onClick={() => handleQuickAdd(quad.id, quad.defaultPriority, quad.defaultDueDate)}
              className="rounded-lg p-1.5 bg-current/15 hover:bg-current/25 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Tasks in Quadrant */}
          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[340px]">
            {isLoading && tasks.length === 0 ? (
              <div className="space-y-1.5 p-1">
                <div className="flex items-center gap-2 rounded-xl border border-[var(--app-border)]/40 bg-[var(--app-panel)]/30 p-2.5">
                  <Skeleton className="h-4 w-4 rounded-md bg-[var(--app-panel-alt)] shrink-0" />
                  <Skeleton className="h-4 w-3/4 rounded bg-[var(--app-panel-alt)]" />
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[var(--app-border)]/40 bg-[var(--app-panel)]/30 p-2.5">
                  <Skeleton className="h-4 w-4 rounded-md bg-[var(--app-panel-alt)] shrink-0" />
                  <Skeleton className="h-4 w-1/2 rounded bg-[var(--app-panel-alt)]" />
                </div>
              </div>
            ) : quad.tasks.length === 0 ? (
              <div className="py-8 text-center app-label opacity-50">No tasks in this quadrant</div>
            ) : (
              quad.tasks.map((task) => {
                const isSelected = selectedTaskId === task.id;
                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task.id)}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 cursor-pointer transition-all ${ isSelected ? "border-[var(--app-accent)] bg-[var(--app-accent)]/10 ring-1 ring-[var(--app-accent)]" : "border-[var(--app-border)] bg-[var(--app-panel)] dark:border-[var(--app-border)] dark:bg-[var(--app-bg)]/80 hover:border-[var(--app-border)]" }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleComplete(task.id, !task.completed);
                        }}
                        className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-[var(--app-border)] hover:border-[var(--app-accent)]"
                      >
                        {task.completed && <Check className="h-3 w-3 text-[var(--app-accent-text)]" />}
                      </button>
                      <span className="app-heading font-semibold text-[var(--app-text)] truncate">
                        {task.title}
                      </span>
                    </div>

                    {task.dueDate && (
                      <span className="app-meta text-[var(--app-muted)] flex items-center gap-1 flex-shrink-0">
                        <Calendar className="h-2.5 w-2.5" />
                        {task.dueDate}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
