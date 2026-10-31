"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Check,
  X,
  Calendar,
  GripVertical,
  LayoutGrid,
  Columns3,
  Clock,
  Sparkles,
  CheckSquare,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Task } from "@/hooks/use-workspace";
import { getTodayISO, formatTaskSchedule } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useWorkspaceContext } from "@/context/workspace-context";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
  type KanbanCommitMeta,
} from "@/components/reui/kanban";

interface EisenhowerMatrixViewProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onAddTask: (task: { title: string; priority: number; dueDate?: string | null }) => Promise<any>;
  isLoading?: boolean;
}

type MatrixQuadrantId = "q1" | "q2" | "q3" | "q4";

interface QuadrantConfig {
  id: MatrixQuadrantId;
  title: string;
  tagline: string;
  subtitle: string;
  colorBorder: string;
  colorBg: string;
  colorText: string;
  badgeClass: string;
  defaultPriority: number;
  defaultDueDate: string | null;
}

export function EisenhowerMatrixView({
  tasks,
  selectedTaskId,
  onSelectTask,
  onToggleComplete,
  onAddTask,
  isLoading,
}: EisenhowerMatrixViewProps) {
  const context = useWorkspaceContext();
  const today = getTodayISO();
  const [viewMode, setViewMode] = useState<"grid" | "board">("grid");
  const [isCreatingInQuad, setIsCreatingInQuad] = useState<string | null>(null);

  const quadrantConfigs: QuadrantConfig[] = useMemo(
    () => [
      {
        id: "q1",
        title: "Do First",
        tagline: "Urgent & Important",
        subtitle: "Crises, deadlines & pressing issues",
        colorBorder: "border-[#eb5757]/30 dark:border-[#eb5757]/20",
        colorBg: "bg-[#eb5757]/[0.03] dark:bg-[#eb5757]/[0.05]",
        colorText: "text-[#eb5757] dark:text-[#ff7369]",
        badgeClass: "bg-[#eb5757]/15 text-[#eb5757] dark:text-[#ff7369] border-[#eb5757]/30",
        defaultPriority: 3,
        defaultDueDate: today,
      },
      {
        id: "q2",
        title: "Schedule",
        tagline: "Not Urgent & Important",
        subtitle: "Strategic planning, health & growth",
        colorBorder: "border-[#dfab01]/30 dark:border-[#dfab01]/20",
        colorBg: "bg-[#dfab01]/[0.03] dark:bg-[#dfab01]/[0.05]",
        colorText: "text-[#dfab01] dark:text-[#f3cd46]",
        badgeClass: "bg-[#dfab01]/15 text-[#dfab01] dark:text-[#f3cd46] border-[#dfab01]/30",
        defaultPriority: 2,
        defaultDueDate: null,
      },
      {
        id: "q3",
        title: "Delegate",
        tagline: "Urgent & Not Important",
        subtitle: "Interruptions, meetings & busywork",
        colorBorder: "border-[#2383e2]/30 dark:border-[#2383e2]/20",
        colorBg: "bg-[#2383e2]/[0.03] dark:bg-[#2383e2]/[0.05]",
        colorText: "text-[#2383e2] dark:text-[#529cca]",
        badgeClass: "bg-[#2383e2]/15 text-[#2383e2] dark:text-[#529cca] border-[#2383e2]/30",
        defaultPriority: 1,
        defaultDueDate: today,
      },
      {
        id: "q4",
        title: "Eliminate",
        tagline: "Not Urgent & Not Important",
        subtitle: "Distractions & low-value activities",
        colorBorder: "border-[var(--app-border)]",
        colorBg: "bg-[var(--app-panel)]/40 dark:bg-[var(--app-panel-alt)]/30",
        colorText: "text-[var(--app-muted)]",
        badgeClass: "bg-[var(--app-hover)] text-[var(--app-muted)] border-[var(--app-border)]",
        defaultPriority: 0,
        defaultDueDate: null,
      },
    ],
    [today]
  );

  // Group active incomplete tasks into 4 quadrants
  const classifyTask = (t: Task): MatrixQuadrantId => {
    // Q1: High priority or (Medium with urgent due date)
    if (t.priority === 3 || (t.priority === 2 && t.dueDate && t.dueDate <= today)) {
      return "q1";
    }
    // Q2: Medium priority without urgent date, or High with future/no date
    if (t.priority === 2 || (t.priority === 3 && (!t.dueDate || t.dueDate > today))) {
      return "q2";
    }
    // Q3: Low priority or urgent due date without high priority
    if (t.priority === 1 || (t.dueDate && t.dueDate <= today)) {
      return "q3";
    }
    // Q4: None priority / neither
    return "q4";
  };

  const groupTasks = (taskList: Task[]): Record<string, Task[]> => {
    const incomplete = taskList.filter((t) => !t.completed && !t.isTrash);
    const groups: Record<string, Task[]> = {
      q1: [],
      q2: [],
      q3: [],
      q4: [],
    };
    for (const t of incomplete) {
      const quad = classifyTask(t);
      groups[quad].push(t);
    }
    return groups;
  };

  const [columns, setColumns] = useState<Record<string, Task[]>>(() => groupTasks(tasks));

  useEffect(() => {
    setColumns(groupTasks(tasks));
  }, [tasks]);

  const handleValueCommit = (
    nextColumns: Record<string, Task[]>,
    meta: KanbanCommitMeta<Task>
  ) => {
    setColumns(nextColumns);

    // If moved to a different quadrant, update task priority & due date
    if (meta.activeContainer && meta.overContainer && meta.activeContainer !== meta.overContainer) {
      const taskId = String(meta.event.active.id);
      const targetQuad = meta.overContainer as MatrixQuadrantId;
      const targetConfig = quadrantConfigs.find((q) => q.id === targetQuad);

      if (targetConfig && context?.updateTask) {
        let newPriority = targetConfig.defaultPriority;
        let newDueDate: string | null | undefined = undefined;

        if (targetQuad === "q1") {
          newPriority = 3;
          newDueDate = today;
        } else if (targetQuad === "q2") {
          newPriority = 2;
          // Keep existing due date if future; otherwise clear today urgency
          const movedTask = tasks.find((t) => t.id === taskId);
          if (movedTask?.dueDate && movedTask.dueDate <= today) {
            newDueDate = null;
          }
        } else if (targetQuad === "q3") {
          newPriority = 1;
          newDueDate = today;
        } else if (targetQuad === "q4") {
          newPriority = 0;
          newDueDate = null;
        }

        context.updateTask({
          taskId,
          priority: newPriority,
          dueDate: newDueDate,
        });
      }
    }
  };

  async function handleCreateTaskInQuadrant(quad: QuadrantConfig) {
    if (isCreatingInQuad) return;
    setIsCreatingInQuad(quad.id);
    try {
      const created = await onAddTask({
        title: "Untitled Task",
        priority: quad.defaultPriority,
        dueDate: quad.defaultDueDate,
      });
      if (created?.id) {
        onSelectTask(created.id);
      }
    } catch (err) {
      console.error("Failed to add task to quadrant:", err);
    } finally {
      setIsCreatingInQuad(null);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden pr-1 pb-4">
      {/* Top Header Controls: Mode Toggles & Info */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--app-border)]/80 gap-2 shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-[var(--app-text)] flex items-center gap-1.5">
            <span>Eisenhower Matrix</span>
            <span className="app-meta font-normal text-[var(--app-muted)]">
              (Drag & Drop Priority Board)
            </span>
          </h2>
          <p className="text-xs text-[var(--app-muted)]">
            Prioritize tasks by urgency and importance. Drag cards between quadrants to realign your focus.
          </p>
        </div>

        {/* View Layout Switcher (2x2 Grid vs 4-Column Board) */}
        <div className="flex items-center gap-1 bg-[var(--app-panel)] border border-[var(--app-border)] rounded-[5px] p-0.5 shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            title="2x2 Matrix Grid View"
            className={cn(
              "flex items-center gap-1 rounded-[3px] px-2 py-1 text-xs font-medium transition-colors cursor-pointer",
              viewMode === "grid"
                ? "bg-[var(--app-panel-alt)] text-[var(--app-accent)] shadow-xs"
                : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">2×2 Matrix</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("board")}
            title="Kanban Columns View"
            className={cn(
              "flex items-center gap-1 rounded-[3px] px-2 py-1 text-xs font-medium transition-colors cursor-pointer",
              viewMode === "board"
                ? "bg-[var(--app-panel-alt)] text-[var(--app-accent)] shadow-xs"
                : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
            )}
          >
            <Columns3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Kanban Lanes</span>
          </button>
        </div>
      </div>

      {/* Main Drag-and-Drop Board */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <Kanban
          value={columns}
          onValueChange={setColumns}
          onValueCommit={handleValueCommit}
          getItemValue={(item: Task) => item.id}
          className="h-full"
        >
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 gap-3 pb-6"
                : "flex gap-3 pb-6 overflow-x-auto min-w-full"
            )}
          >
            {quadrantConfigs.map((quad) => {
              const quadTasks = columns[quad.id] || [];

              return (
                <KanbanColumn
                  key={quad.id}
                  value={quad.id}
                  className={cn(
                    "flex flex-col rounded-[6px] border transition-all min-h-[340px]",
                    quad.colorBorder,
                    quad.colorBg,
                    viewMode === "board" ? "w-[300px] shrink-0" : "w-full"
                  )}
                >
                  {/* Quadrant Header */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-current/15 select-none">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-bold uppercase tracking-wider", quad.colorText)}>
                          {quad.title}
                        </span>
                        <span className="app-meta text-[var(--app-muted)] font-normal truncate">
                          • {quad.tagline}
                        </span>
                      </div>
                      <p className="app-meta text-[var(--app-muted)]/80 truncate">
                        {quad.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className={cn("rounded-[3px] border px-1.5 py-0.5 text-xs font-semibold", quad.badgeClass)}>
                        {quadTasks.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCreateTaskInQuadrant(quad)}
                        disabled={isCreatingInQuad === quad.id}
                        title={`Add task to ${quad.title} and open details drawer`}
                        className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-current/25 bg-[var(--app-panel)] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover)] transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Task List with Drag & Drop and Accordion Properties */}
                  <KanbanColumnContent
                    value={quad.id}
                    className="flex-1 p-0 overflow-y-auto max-h-[420px]"
                  >
                    {isLoading && tasks.length === 0 ? (
                      <div className="divide-y divide-[var(--app-border)]/40 border-t border-b border-[var(--app-border)]/40">
                        <div className="flex items-center gap-2 p-3">
                          <Skeleton className="h-3.5 w-3.5 rounded-[3px] bg-[var(--app-hover)] shrink-0" />
                          <Skeleton className="h-3.5 w-3/4 rounded bg-[var(--app-hover)]" />
                        </div>
                        <div className="flex items-center gap-2 p-3">
                          <Skeleton className="h-3.5 w-3.5 rounded-[3px] bg-[var(--app-hover)] shrink-0" />
                          <Skeleton className="h-3.5 w-1/2 rounded bg-[var(--app-hover)]" />
                        </div>
                      </div>
                    ) : quadTasks.length === 0 ? (
                      <div className="py-10 text-center text-xs text-[var(--app-muted)]/60 select-none">
                        Drop tasks here
                      </div>
                    ) : (
                      <Accordion
                        multiple
                        defaultValue={[]}
                        className="divide-y divide-[var(--app-border)]/50 border-t border-b border-current/15"
                      >
                        {quadTasks.map((task) => {
                          const isSelected = selectedTaskId === task.id;
                          const schedule = formatTaskSchedule(task);
                          const completedSubtasks = task.subtasks?.filter((s) => s.completed).length ?? 0;
                          const totalSubtasks = task.subtasks?.length ?? 0;

                          return (
                            <KanbanItem
                              key={task.id}
                              value={task.id}
                              className={cn(
                                "group/item relative transition-colors select-none",
                                isSelected
                                  ? "bg-[var(--app-hover)] text-[var(--app-text)]"
                                  : "hover:bg-[var(--app-hover)]/40 text-[var(--app-text)]"
                              )}
                            >
                              <AccordionItem value={task.id} className="border-none">
                                {/* Task Row */}
                                <div
                                  onClick={() => onSelectTask(task.id)}
                                  className="flex items-center justify-between gap-2 px-3 py-2 text-xs cursor-pointer"
                                >
                                  {/* Drag handle */}
                                  <KanbanItemHandle
                                    render={(handleProps) => (
                                      <button
                                        {...handleProps}
                                        type="button"
                                        onClick={(e) => e.stopPropagation()}
                                        title="Drag to reorder or move quadrant"
                                        className="opacity-0 group-hover/item:opacity-100 text-[var(--app-muted)] hover:text-[var(--app-text)] cursor-grab active:cursor-grabbing p-0.5 -ml-1 transition-opacity shrink-0"
                                      >
                                        <GripVertical className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  />

                                  {/* Task checkbox & title */}
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleComplete(task.id, !task.completed);
                                      }}
                                      title={task.completed ? "Mark incomplete" : "Mark complete"}
                                      className={cn(
                                        "flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-[3px] border transition-colors cursor-pointer",
                                        task.completed
                                          ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-white"
                                          : "border-[var(--app-border)] hover:border-[var(--app-accent)]"
                                      )}
                                    >
                                      {task.completed && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                    </button>

                                    <span
                                      className={cn(
                                        "truncate font-medium text-xs",
                                        task.completed ? "line-through text-[var(--app-muted)]" : "text-[var(--app-text)]"
                                      )}
                                    >
                                      {task.title}
                                    </span>
                                  </div>

                                  {/* Badges, List Color Ball, Accordion Trigger */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    {totalSubtasks > 0 && (
                                      <span
                                        className="app-meta text-[var(--app-muted)] flex items-center gap-1 font-mono text-[10px]"
                                        title={`${completedSubtasks}/${totalSubtasks} subtasks complete`}
                                      >
                                        <CheckSquare className="h-2.5 w-2.5" />
                                        <span>{completedSubtasks}/{totalSubtasks}</span>
                                      </span>
                                    )}

                                    {schedule && (
                                      <span className="app-meta text-[var(--app-muted)] flex items-center gap-1 font-mono text-[10px]">
                                        <Calendar className="h-2.5 w-2.5" />
                                        <span>{schedule.dateLabel}</span>
                                      </span>
                                    )}

                                    {/* List Color Ball (Enlarged per user request) */}
                                    {task.list && (
                                      <div
                                        className="flex items-center gap-1.5"
                                        title={`List: ${task.list.name}`}
                                      >
                                        <span
                                          className="h-2.5 w-2.5 rounded-full shrink-0 ring-1 ring-black/15 dark:ring-white/20 shadow-2xs"
                                          style={{ backgroundColor: task.list.color }}
                                        />
                                        <span className="app-meta text-[var(--app-muted)] hidden xl:inline max-w-[80px] truncate text-[10px]">
                                          {task.list.name}
                                        </span>
                                      </div>
                                    )}

                                    {/* Chevron "v" button trigger */}
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <AccordionTrigger
                                        header={false}
                                        className="p-1 rounded-[4px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover)] transition-colors cursor-pointer shrink-0"
                                        aria-label={`View properties for ${task.title}`}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Accordion Content: Task Properties Viewer */}
                                <AccordionContent className="px-3 pb-2.5 pt-0">
                                  <div className="rounded-[4px] border border-[var(--app-border)]/50 bg-[var(--app-panel-alt)]/60 p-2.5 space-y-2 text-xs">
                                    {/* Properties Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                      {/* List Property */}
                                      <div className="flex items-center gap-2">
                                        <span className="text-[var(--app-muted)] w-16 shrink-0 app-meta">List:</span>
                                        <span className="flex items-center gap-1.5 text-[var(--app-text)] font-medium">
                                          {task.list ? (
                                            <>
                                              <span
                                                className="h-2.5 w-2.5 rounded-full shrink-0 ring-1 ring-black/15 dark:ring-white/20"
                                                style={{ backgroundColor: task.list.color }}
                                              />
                                              <span>{task.list.name}</span>
                                            </>
                                          ) : (
                                            <span className="text-[var(--app-muted)]">Inbox</span>
                                          )}
                                        </span>
                                      </div>

                                      {/* Priority Property */}
                                      <div className="flex items-center gap-2">
                                        <span className="text-[var(--app-muted)] w-16 shrink-0 app-meta">Priority:</span>
                                        <span className={cn(
                                          "px-1.5 py-0.5 rounded-[3px] text-[10px] font-semibold border",
                                          task.priority === 3
                                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                                            : task.priority === 2
                                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                            : task.priority === 1
                                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                            : "bg-[var(--app-hover)] text-[var(--app-muted)] border-[var(--app-border)]"
                                        )}>
                                          {task.priority === 3 ? "High (P1)" : task.priority === 2 ? "Medium (P2)" : task.priority === 1 ? "Low (P3)" : "None"}
                                        </span>
                                      </div>

                                      {/* Schedule Property */}
                                      <div className="flex items-center gap-2">
                                        <span className="text-[var(--app-muted)] w-16 shrink-0 app-meta">Schedule:</span>
                                        <span className="text-[var(--app-text)] flex items-center gap-1">
                                          <Calendar className="h-3 w-3 text-[var(--app-muted)]" />
                                          <span>{schedule ? schedule.dateLabel : "No date set"}</span>
                                          {task.dueTime && <span className="text-[var(--app-muted)]">at {task.dueTime}</span>}
                                        </span>
                                      </div>

                                      {/* Tags Property */}
                                      <div className="flex items-center gap-2">
                                        <span className="text-[var(--app-muted)] w-16 shrink-0 app-meta">Tags:</span>
                                        <div className="flex flex-wrap gap-1">
                                          {task.tags && task.tags.length > 0 ? (
                                            task.tags.map((t) => (
                                              <span
                                                key={t.tagId || t.tag.id}
                                                className="px-1.5 py-0.2 rounded-[3px] text-[10px] font-medium bg-[var(--app-panel)] border border-[var(--app-border)] text-[var(--app-text)]"
                                              >
                                                #{t.tag.name}
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-[var(--app-muted)] italic">No tags</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Description / Notes */}
                                    {task.description && (
                                      <div className="pt-1.5 border-t border-[var(--app-border)]/40">
                                        <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--app-muted)] block mb-1">
                                          Notes
                                        </span>
                                        <p className="text-[var(--app-text)] text-xs whitespace-pre-wrap leading-relaxed bg-[var(--app-panel)] p-2 rounded-[3px] border border-[var(--app-border)]/40">
                                          {task.description}
                                        </p>
                                      </div>
                                    )}

                                    {/* Subtasks checklist if any */}
                                    {task.subtasks && task.subtasks.length > 0 && (
                                      <div className="pt-1.5 border-t border-[var(--app-border)]/40">
                                        <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--app-muted)] block mb-1">
                                          Subtasks ({completedSubtasks}/{totalSubtasks})
                                        </span>
                                        <div className="space-y-1">
                                          {task.subtasks.map((st) => (
                                            <div
                                              key={st.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (context?.updateTask) {
                                                  const updatedSubtasks = task.subtasks.map((s) =>
                                                    s.id === st.id ? { ...s, completed: !s.completed } : s
                                                  );
                                                  context.updateTask({ taskId: task.id, subtasks: updatedSubtasks });
                                                }
                                              }}
                                              className="flex items-center gap-2 px-1.5 py-1 rounded-[3px] hover:bg-[var(--app-hover)] transition-colors cursor-pointer"
                                            >
                                              <div className={cn(
                                                "h-3 w-3 rounded-[2px] border flex items-center justify-center",
                                                st.completed
                                                  ? "bg-[var(--app-accent)] border-[var(--app-accent)] text-white"
                                                  : "border-[var(--app-border)]"
                                              )}>
                                                {st.completed && <Check className="h-2 w-2 stroke-[3]" />}
                                              </div>
                                              <span className={cn(
                                                "text-xs truncate",
                                                st.completed ? "line-through text-[var(--app-muted)]" : "text-[var(--app-text)]"
                                              )}>
                                                {st.title}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Action row */}
                                    <div className="flex items-center justify-between pt-1 border-t border-[var(--app-border)]/40">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSelectTask(task.id);
                                        }}
                                        className="text-[11px] font-medium text-[var(--app-accent)] hover:underline flex items-center gap-1 cursor-pointer"
                                      >
                                        <span>Open task details &rarr;</span>
                                      </button>

                                      <span className="text-[10px] text-[var(--app-muted)]">
                                        Drag grip to reorder or move
                                      </span>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </KanbanItem>
                          );
                        })}
                      </Accordion>
                    )}
                  </KanbanColumnContent>
                </KanbanColumn>
              );
            })}
          </div>

          {/* Drag Overlay for smooth card movement */}
          <KanbanOverlay>
            {({ value }) => {
              const task = tasks.find((t) => t.id === value);
              if (!task) return null;

              return (
                <div className="flex items-center gap-2 rounded-[4px] border border-[var(--app-accent)] bg-[var(--app-panel)] p-2 text-xs shadow-lg ring-1 ring-[var(--app-accent)] opacity-95 text-[var(--app-text)] select-none">
                  <GripVertical className="h-3.5 w-3.5 text-[var(--app-accent)] shrink-0" />
                  <span className="truncate font-medium">{task.title}</span>
                </div>
              );
            }}
          </KanbanOverlay>
        </Kanban>
      </div>
    </div>
  );
}
