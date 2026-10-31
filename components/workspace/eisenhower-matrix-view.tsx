"use client";

import React, { useState } from "react";
import { Plus, Check, X, Calendar, CheckCircle2 } from "lucide-react";
import { Task } from "@/hooks/use-workspace";
import { getTodayISO, formatTaskSchedule } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
      color: "border-[rgba(255,0,26,0.25)] bg-[rgba(255,0,26,0.03)] text-[#eb5757] dark:text-[#ff7369]",
      accent: "#eb5757",
      tasks: q1Tasks,
      defaultPriority: 3,
      defaultDueDate: today,
    },
    {
      id: "q2",
      title: "Not Urgent & Important",
      subtitle: "Schedule • Strategic Planning & Growth",
      color: "border-[rgba(203,145,47,0.25)] bg-[rgba(203,145,47,0.03)] text-[#dfab01] dark:text-[#f3cd46]",
      accent: "#dfab01",
      tasks: q2Tasks,
      defaultPriority: 2,
      defaultDueDate: null,
    },
    {
      id: "q3",
      title: "Urgent & Not Important",
      subtitle: "Delegate • Interruptions & Busywork",
      color: "border-[rgba(35,131,226,0.25)] bg-[rgba(35,131,226,0.03)] text-[#2383e2] dark:text-[#529cca]",
      accent: "#2383e2",
      tasks: q3Tasks,
      defaultPriority: 1,
      defaultDueDate: today,
    },
    {
      id: "q4",
      title: "Not Urgent & Not Important",
      subtitle: "Eliminate • Distractions & Time Wasters",
      color: "border-[var(--app-border)] bg-[rgba(55,53,47,0.03)] dark:bg-[rgba(255,255,255,0.02)] text-[var(--app-muted)]",
      accent: "#787774",
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
    <div className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
        {quadrants.map((quad) => (
          <div
            key={quad.id}
            className={`flex flex-col rounded-[8px] border p-3.5 transition-all ${quad.color} min-h-[300px]`}
          >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-current/15">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider">{quad.title}</h3>
              <p className="text-[11px] opacity-75">{quad.subtitle}</p>
            </div>
            <span className="rounded-[3px] px-1.5 py-0.5 text-xs font-medium bg-current/10">
              {quad.tasks.length}
            </span>
          </div>

          {/* Quick Input Form */}
          <div className="flex items-center gap-1.5 mb-2.5">
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
              className="flex-1 rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1 text-xs text-[var(--app-text)] placeholder-[var(--app-muted)] focus:outline-none focus:border-[var(--app-accent)]"
            />
            <button
              type="button"
              onClick={() => handleQuickAdd(quad.id, quad.defaultPriority, quad.defaultDueDate)}
              className="rounded-[4px] p-1 bg-current/10 hover:bg-current/20 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Tasks in Quadrant */}
          <div className="flex-1 space-y-1 overflow-y-auto max-h-[340px]">
            {isLoading && tasks.length === 0 ? (
              <div className="space-y-1.5 p-1">
                <div className="flex items-center gap-2 rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)]/30 p-2">
                  <Skeleton className="h-3.5 w-3.5 rounded-[3px] bg-[var(--app-hover)] shrink-0" />
                  <Skeleton className="h-3.5 w-3/4 rounded bg-[var(--app-hover)]" />
                </div>
                <div className="flex items-center gap-2 rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)]/30 p-2">
                  <Skeleton className="h-3.5 w-3.5 rounded-[3px] bg-[var(--app-hover)] shrink-0" />
                  <Skeleton className="h-3.5 w-1/2 rounded bg-[var(--app-hover)]" />
                </div>
              </div>
            ) : quad.tasks.length === 0 ? (
              <div className="py-8 text-center text-xs opacity-50">No tasks in this quadrant</div>
            ) : (
              quad.tasks.map((task) => {
                const isSelected = selectedTaskId === task.id;
                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task.id)}
                    className={`flex items-center justify-between gap-2 rounded-[4px] border p-2 cursor-pointer transition-colors ${ isSelected ? "border-[var(--app-accent)] bg-[var(--app-hover)] ring-1 ring-[var(--app-accent)]" : "border-[var(--app-border)] bg-[var(--app-panel)] hover:bg-[var(--app-hover)]" }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {(() => {
                        const isWontDo = Boolean(task.completed && task.kanbanStatus === "WONT_DO");
                        return (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleComplete(task.id, !task.completed);
                              }}
                              title={isWontDo ? "Won't Do" : task.completed ? "Completed" : "Mark complete"}
                              className={cn(
                                "flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-[3px] border transition-colors",
                                task.completed
                                  ? isWontDo
                                    ? "border-rose-500 bg-rose-500 text-white"
                                    : "border-[var(--app-accent)] bg-[var(--app-accent)] text-white"
                                  : "border-[var(--app-border)] hover:border-[var(--app-accent)]"
                              )}
                            >
                              {task.completed && (
                                isWontDo ? <X className="h-2.5 w-2.5 stroke-[3]" /> : <Check className="h-2.5 w-2.5 stroke-[3]" />
                              )}
                            </button>
                            <span className={cn(
                              "text-xs font-medium truncate",
                              task.completed ? "line-through text-[var(--app-muted)]" : "text-[var(--app-text)]"
                            )}>
                              {task.title}
                            </span>
                            {isWontDo && (
                              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-[3px] px-1 py-0.2 text-[10px] font-medium bg-[rgba(255,0,26,0.1)] text-[#eb5757] border border-[rgba(255,0,26,0.2)]">
                                Won&apos;t Do
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {(() => {
                      const schedule = formatTaskSchedule(task);
                      if (!schedule) return null;
                      return (
                        <span className="text-[11px] text-[var(--app-muted)] flex items-center gap-1 flex-shrink-0 font-mono">
                          <Calendar className="h-2.5 w-2.5" />
                          <span>{schedule.dateLabel}</span>
                          {schedule.durationBadge && (
                            <span className="ml-0.5 rounded-[3px] px-1 py-0.2 bg-[var(--app-hover)] text-[var(--app-text)] text-[9px]">
                              {schedule.durationBadge}
                            </span>
                          )}
                        </span>
                      );
                    })()}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
