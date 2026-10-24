"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  Calendar,
  Flag,
  Folder,
  Tag as TagIcon,
  Trash2,
  Pin,
  Plus,
  Sparkles,
  Type,
  MessageSquare,
  MoreHorizontal,
  Timer,
  CheckCircle2,
  Circle,
  ListPlus,
  XIcon,
} from "lucide-react";
import { Task, TaskList, Tag, TaskReminder, ListMember } from "@/hooks/use-ticktick";
import { getTodayISO, formatShortDate, parseISODate } from "@/lib/date-utils";
import { TaskDatePickerPopover } from "./task-date-picker-popover";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { useTickTickContext } from "@/context/ticktick-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface TaskInspectorProps {
  task: Task | null;
  lists: TaskList[];
  tags: Tag[];
  onClose: () => void;
  onUpdateTask: (updates: { taskId: string } & Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  reminders?: TaskReminder[];
  members?: ListMember[];
  assignees?: ListMember[];
  onCreateReminder?: (input: {
    taskId: string;
    type: string;
    remindAt?: string;
    minutesBefore?: number;
  }) => void | Promise<void>;
  onUpdateReminder?: (
    id: string,
    updates: Partial<{ type: string; remindAt: string | null; minutesBefore: number | null; enabled: boolean }>
  ) => void | Promise<void>;
  onDeleteReminder?: (id: string) => void | Promise<void>;
  onInviteMember?: (input: {
    listId: string;
    email: string;
    displayName?: string;
    role?: string;
  }) => void | Promise<void>;
  onUpdateMember?: (
    memberId: string,
    updates: Partial<{ role: string; status: string }>
  ) => void | Promise<void>;
  onRemoveMember?: (memberId: string) => void | Promise<void>;
  onAssign?: (taskId: string, memberIds: string[]) => void | Promise<void>;
}

export function TaskInspector({
  task,
  lists,
  tags,
  onClose,
  onUpdateTask,
  onDeleteTask,
}: TaskInspectorProps) {
  const context = useTickTickContext();
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<{ id: string; name: string } | null>(null);
  const [localTags, setLocalTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const newSubtaskInputRef = useRef<HTMLInputElement>(null);

  // Sync localTags from task.tags with fallback to global tags cache
  useEffect(() => {
    if (task) {
      const parsed = (task.tags || [])
        .map((t: any) => {
          if (!t) return null;
          if (t.tag && t.tag.id) return { id: t.tag.id, name: t.tag.name, color: t.tag.color || "#4772fa" };
          if (t.id && t.name) return { id: t.id, name: t.name, color: t.color || "#4772fa" };
          if (typeof t === "string" || t.tagId) {
            const id = typeof t === "string" ? t : t.tagId;
            const found = tags.find((tg) => tg.id === id);
            return { id, name: found?.name || id, color: found?.color || "#4772fa" };
          }
          return null;
        })
        .filter(Boolean) as { id: string; name: string; color: string }[];
      setLocalTags(parsed);
    }
  }, [task?.id, task?.tags, tags]);

  // Computed progress percentage (100 if completed, else based on subtasks or in-progress status)
  const computedProgress = task?.completed
    ? 100
    : task?.subtasks && task.subtasks.length > 0
    ? Math.round(
        (task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100
      )
    : task?.kanbanStatus === "IN_PROGRESS"
    ? 50
    : 0;

  const [progress, setProgress] = useState(computedProgress);

  useEffect(() => {
    setProgress(computedProgress);
  }, [computedProgress, task?.id]);

  function handleProgressChange(newVal: number | readonly number[]) {
    const val = Array.isArray(newVal) ? newVal[0] : (newVal as number);
    setProgress(val);

    if (val === 100) {
      onUpdateTask({ taskId: task!.id, completed: true, kanbanStatus: "DONE" });
    } else if (val === 0) {
      onUpdateTask({ taskId: task!.id, completed: false, kanbanStatus: "TODO" });
    } else {
      onUpdateTask({ taskId: task!.id, completed: false, kanbanStatus: "IN_PROGRESS" });
    }
  }

  function getOverdueLabel(dueDateStr: string): string {
    try {
      const due = parseISODate(dueDateStr);
      const now = parseISODate(getTodayISO());
      if (!due || !now) return formatShortDate(dueDateStr);
      const diffTime = now.getTime() - due.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return formatShortDate(dueDateStr);
      if (diffDays === 1) return `1 day ago, Yesterday`;
      return `${diffDays} days ago, ${formatShortDate(dueDateStr)}`;
    } catch {
      return formatShortDate(dueDateStr);
    }
  }

  async function handleCreateTag() {
    const rawName = tagSearch.trim().replace(/^#/, "");
    if (!rawName || isCreatingTag || !task) return;

    // Check if tag already exists in tags list
    const existing = tags.find((t) => t.name.toLowerCase() === rawName.toLowerCase());
    if (existing) {
      handleToggleTag(existing.id);
      setTagSearch("");
      return;
    }

    // 1. Instant optimistic update: add temp tag to localTags immediately (0ms)
    const tempId = `temp-${Date.now()}`;
    const tempTag = { id: tempId, name: rawName, color: "#4772fa" };

    setLocalTags((prev) => [...prev, tempTag]);
    setTagSearch("");

    // 2. Background creation and sync
    setIsCreatingTag(true);
    try {
      if (context?.addTag) {
        const res = await context.addTag({ name: rawName, color: "#4772fa" });
        const realTag = res?.tag || res;
        if (realTag?.id) {
          // Replace tempId with realTag.id in localTags
          setLocalTags((prev) =>
            prev.map((t) => (t.id === tempId ? { ...t, id: realTag.id } : t))
          );

          // Update task on server
          const currentIds = localTags
            .map((t) => (t.id === tempId ? realTag.id : t.id))
            .filter((id) => !id.startsWith("temp-"));
          if (!currentIds.includes(realTag.id)) currentIds.push(realTag.id);

          onUpdateTask({ taskId: task.id, tags: currentIds as any });
        }
      }
    } catch (err) {
      console.error("Failed to create tag:", err);
      // Revert optimistic tag on failure
      setLocalTags((prev) => prev.filter((t) => t.id !== tempId));
    } finally {
      setIsCreatingTag(false);
    }
  }

  useEffect(() => {
    if (!showDatePicker) return;
    function handleClickOutside(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDatePicker]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
    }
  }, [task?.id, task?.title, task?.description]);

  if (!task) return null;

  const today = getTodayISO();
  const isOverdue = task.dueDate && task.dueDate < today && !task.completed;
  const isDueToday = task.dueDate && task.dueDate === today;

  function handleTitleBlur() {
    if (title.trim() && title !== task?.title) {
      onUpdateTask({ taskId: task!.id, title: title.trim() });
    }
  }

  function handleDescriptionBlur() {
    if (description !== (task?.description || "")) {
      onUpdateTask({ taskId: task!.id, description });
    }
  }

  function handleToggleSubtask(subtaskId: string, completed: boolean) {
    const nextSubtasks = task!.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed } : s
    );
    onUpdateTask({ taskId: task!.id, subtasks: nextSubtasks });
  }

  function handleAddSubtask() {
    if (!newSubtaskTitle.trim()) return;

    const nextSubtasks = [
      ...task!.subtasks,
      {
        id: `temp-${Date.now()}`,
        taskId: task!.id,
        title: newSubtaskTitle.trim(),
        completed: false,
        order: task!.subtasks.length + 1,
      },
    ];

    onUpdateTask({ taskId: task!.id, subtasks: nextSubtasks });
    setNewSubtaskTitle("");
  }

  function handleDeleteSubtask(subtaskId: string) {
    const nextSubtasks = task!.subtasks.filter((s) => s.id !== subtaskId);
    onUpdateTask({ taskId: task!.id, subtasks: nextSubtasks });
  }

  function handleToggleTag(tagId: string) {
    if (!task) return;
    const isCurrentlySelected = localTags.some((tg) => tg.id === tagId);
    const targetTag = tags.find((tg) => tg.id === tagId) || { id: tagId, name: "", color: "#4772fa" };

    // 1. Instant optimistic update in drawer UI (0ms)
    const nextLocalTags = isCurrentlySelected
      ? localTags.filter((tg) => tg.id !== tagId)
      : [...localTags, targetTag];

    setLocalTags(nextLocalTags);

    // 2. Background sync
    const nextTagIds = nextLocalTags.map((tg) => tg.id);
    onUpdateTask({ taskId: task.id, tags: nextTagIds as any });
  }

  function cyclePriority() {
    const nextPriority = (task!.priority + 1) % 4; // 0 -> 1 -> 2 -> 3 -> 0
    onUpdateTask({ taskId: task!.id, priority: nextPriority });
  }

  const currentList = lists.find((l) => l.id === task.listId);
  const normalizedTagIds = localTags.map((t) => t.id);
  const filteredTags = tags.filter((t) =>
    !tagSearch.trim() || t.name.toLowerCase().includes(tagSearch.trim().toLowerCase())
  );
  const hasExactMatch = tags.some(
    (t) => t.name.toLowerCase() === tagSearch.trim().toLowerCase()
  );

  return (
    <>
      <aside className="flex flex-col h-full w-80 md:w-96 border-l border-[var(--tt-border)] bg-[var(--tt-panel)] shadow-xl z-20 flex-shrink-0 animate-in slide-in-from-right duration-200 relative">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-[var(--tt-border)]/80 px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            {/* Complete Task Toggle Checkbox with Context Menu */}
            <ContextMenu>
              <ContextMenuTrigger className="inline-flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const nextCompleted = !task.completed;
                    onUpdateTask({
                      taskId: task.id,
                      completed: nextCompleted,
                      kanbanStatus: nextCompleted ? "DONE" : "TODO",
                    });
                  }}
                  className={cn(
                    "flex h-4.5 w-4.5 items-center justify-center rounded border transition-all active:scale-90 cursor-pointer",
                    task.completed
                      ? task.kanbanStatus === "WONT_DO"
                        ? "border-rose-500 bg-rose-500 text-white shadow-xs"
                        : "border-emerald-500 bg-emerald-500 text-white shadow-xs"
                      : "border-[var(--tt-border)] hover:border-[var(--tt-accent)] text-[var(--tt-muted)]"
                  )}
                  title={
                    task.completed
                      ? "Mark incomplete (Right-click for options)"
                      : "Mark complete (Right-click for options)"
                  }
                >
                  {task.completed && (
                    task.kanbanStatus === "WONT_DO" ? (
                      <X className="h-3 w-3 stroke-[3]" />
                    ) : (
                      <Check className="h-3 w-3 stroke-[3]" />
                    )
                  )}
                </button>
              </ContextMenuTrigger>

              <ContextMenuContent className="w-52 bg-[var(--tt-panel)] border-[var(--tt-border)] text-[var(--tt-text)] shadow-xl p-1.5 z-50">
                <ContextMenuItem
                  onClick={() => {
                    const nextCompleted = task.completed && task.kanbanStatus !== "WONT_DO" ? false : true;
                    onUpdateTask({
                      taskId: task.id,
                      completed: nextCompleted,
                      kanbanStatus: nextCompleted ? "DONE" : "TODO",
                    });
                  }}
                  className="flex items-center justify-between cursor-pointer py-1.5 px-2.5 rounded-md text-xs hover:bg-[var(--tt-panel-alt)]"
                >
                  <span>Completed</span>
                  {task.completed && task.kanbanStatus !== "WONT_DO" && (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                </ContextMenuItem>

                <ContextMenuItem
                  onClick={() => {
                    const nextWonDo = task.completed && task.kanbanStatus === "WONT_DO" ? false : true;
                    onUpdateTask({
                      taskId: task.id,
                      completed: nextWonDo,
                      kanbanStatus: nextWonDo ? "WONT_DO" : "TODO",
                    });
                  }}
                  className="flex items-center justify-between cursor-pointer py-1.5 px-2.5 rounded-md text-xs hover:bg-[var(--tt-panel-alt)]"
                >
                  <span>Won&apos;t Do</span>
                  {task.completed && task.kanbanStatus === "WONT_DO" && (
                    <Check className="h-3.5 w-3.5 text-rose-500" />
                  )}
                </ContextMenuItem>

                <ContextMenuSeparator className="my-1.5 bg-[var(--tt-border)]" />

                <div
                  className="px-2.5 py-1.5 space-y-2 select-none"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between tt-meta text-[var(--tt-muted)]">
                    <span>Progress</span>
                    <span className="font-semibold text-[var(--tt-text)]">{progress}%</span>
                  </div>
                  <Slider
                    value={[progress]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={handleProgressChange}
                    className="w-full"
                  />
                </div>
              </ContextMenuContent>
            </ContextMenu>

            {/* Vertical Divider */}
            <span className="h-3.5 w-px bg-[var(--tt-border)]/80" />

            {/* Due Date Trigger Button */}
            <div className="relative" ref={datePickerRef}>
              <button
                type="button"
                onClick={() => setShowDatePicker((prev) => !prev)}
                className={cn(
                  "flex items-center gap-1.5 tt-meta font-medium rounded px-1.5 py-0.5 transition-colors cursor-pointer",
                  isOverdue
                    ? "text-rose-500 font-semibold hover:bg-rose-500/10"
                    : isDueToday
                    ? "text-rose-500 font-semibold hover:bg-rose-500/10"
                    : task.dueDate
                    ? "text-[var(--tt-accent-text)] hover:bg-[var(--tt-panel-alt)]"
                    : "text-[var(--tt-muted)] hover:text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)]"
                )}
                title="Change due date"
              >
                <Calendar
                  className={cn(
                    "h-3.5 w-3.5",
                    isOverdue || isDueToday ? "text-rose-500" : undefined
                  )}
                />
                <span>
                  {task.dueDate
                    ? isOverdue
                      ? getOverdueLabel(task.dueDate)
                      : isDueToday
                      ? "Today"
                      : formatShortDate(task.dueDate)
                    : "Set date"}
                  {task.dueTime ? ` ${task.dueTime}` : ""}
                </span>
              </button>

              {/* Date Picker Popover */}
              {showDatePicker && (
                <div className="absolute left-0 top-full mt-1 z-50">
                  <TaskDatePickerPopover
                    dueDate={task.dueDate || null}
                    endDate={task.endDate || null}
                    dueTime={task.dueTime || null}
                    endTime={task.endTime || null}
                    onSelect={(dueDate, dueTime, endDate, endTime) => {
                      onUpdateTask({
                        taskId: task.id,
                        dueDate,
                        dueTime,
                        endDate,
                        endTime,
                        startDate: dueDate,
                        startTime: dueTime,
                      });
                      setShowDatePicker(false);
                    }}
                    onClose={() => setShowDatePicker(false)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Priority Flag Dropdown Menu (Image 3 Style) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title={`Priority: ${
                    task.priority === 3
                      ? "High"
                      : task.priority === 2
                      ? "Medium"
                      : task.priority === 1
                      ? "Low"
                      : "None"
                  }. Click to change.`}
                  className={cn(
                    "p-1.5 rounded transition-colors cursor-pointer",
                    task.priority === 3
                      ? "text-rose-500 hover:bg-rose-500/10"
                      : task.priority === 2
                      ? "text-amber-500 hover:bg-amber-500/10"
                      : task.priority === 1
                      ? "text-sky-500 hover:bg-sky-500/10"
                      : "text-[var(--tt-muted)] hover:text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)]"
                  )}
                >
                  <Flag
                    className={cn(
                      "h-4 w-4",
                      task.priority > 0 && "fill-current"
                    )}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-36 bg-[var(--tt-panel)] border-[var(--tt-border)] text-[var(--tt-text)] p-1 z-50"
              >
                <DropdownMenuItem
                  onClick={() => onUpdateTask({ taskId: task.id, priority: 3 })}
                  className="flex items-center justify-between cursor-pointer py-1.5 px-2 rounded-md hover:bg-[var(--tt-panel-alt)]"
                >
                  <span className="flex items-center gap-2">
                    <Flag className="h-3.5 w-3.5 text-rose-500 fill-current" />
                    <span className="text-xs font-medium">High</span>
                  </span>
                  {task.priority === 3 && <Check className="h-3.5 w-3.5 text-rose-500" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateTask({ taskId: task.id, priority: 2 })}
                  className="flex items-center justify-between cursor-pointer py-1.5 px-2 rounded-md hover:bg-[var(--tt-panel-alt)]"
                >
                  <span className="flex items-center gap-2">
                    <Flag className="h-3.5 w-3.5 text-amber-500 fill-current" />
                    <span className="text-xs font-medium">Medium</span>
                  </span>
                  {task.priority === 2 && <Check className="h-3.5 w-3.5 text-amber-500" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateTask({ taskId: task.id, priority: 1 })}
                  className="flex items-center justify-between cursor-pointer py-1.5 px-2 rounded-md hover:bg-[var(--tt-panel-alt)]"
                >
                  <span className="flex items-center gap-2">
                    <Flag className="h-3.5 w-3.5 text-sky-500 fill-current" />
                    <span className="text-xs font-medium">Low</span>
                  </span>
                  {task.priority === 1 && <Check className="h-3.5 w-3.5 text-sky-500" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateTask({ taskId: task.id, priority: 0 })}
                  className="flex items-center justify-between cursor-pointer py-1.5 px-2 rounded-md hover:bg-[var(--tt-panel-alt)]"
                >
                  <span className="flex items-center gap-2">
                    <Flag className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-medium">None</span>
                  </span>
                  {task.priority === 0 && <Check className="h-3.5 w-3.5 text-slate-400" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Close Inspector */}
            <button
              type="button"
              onClick={onClose}
              title="Close drawer"
              className="rounded p-1.5 text-[var(--tt-muted)] hover:text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Title input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Task title..."
              className={cn(
                "w-full bg-transparent tt-title text-lg md:text-xl font-bold text-[var(--tt-text)] focus:outline-none placeholder-[var(--tt-muted)]/60",
                task.completed && "line-through opacity-60 text-[var(--tt-muted)]"
              )}
            />
          </div>

          {/* Description textarea */}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Write something or type / for commands"
              rows={3}
              className="w-full bg-transparent tt-body text-[var(--tt-text)] placeholder-[var(--tt-muted)]/70 resize-none focus:outline-none min-h-[70px] leading-relaxed"
            />
          </div>

          {/* Subtasks / Checklist Section */}
          <div className="space-y-2 pt-1 border-t border-[var(--tt-border)]/60">
            {/* Existing Subtasks */}
            {task.subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="group flex items-center gap-2 py-0.5"
              >
                <button
                  type="button"
                  onClick={() => handleToggleSubtask(subtask.id, !subtask.completed)}
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer",
                    subtask.completed
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-[var(--tt-border)] hover:border-[var(--tt-accent)]"
                  )}
                >
                  {subtask.completed && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </button>
                <span
                  className={cn(
                    "flex-1 tt-body text-xs text-[var(--tt-text)] truncate",
                    subtask.completed && "line-through text-[var(--tt-muted)] opacity-60"
                  )}
                >
                  {subtask.title}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteSubtask(subtask.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--tt-muted)] hover:text-rose-500 transition-opacity"
                  title="Delete subtask"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            ))}

            {/* Empty Subtask Row: "Press 'Enter' to add list item" */}
            <div className="flex items-center gap-2 py-0.5">
              <Circle className="h-4 w-4 shrink-0 text-[var(--tt-muted)]/60" />
              <input
                ref={newSubtaskInputRef}
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Press 'Enter' to add list item"
                className="flex-1 bg-transparent tt-body text-xs text-[var(--tt-text)] placeholder-[var(--tt-muted)]/70 focus:outline-none"
              />
            </div>
          </div>

          {/* Tags Section */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            {localTags.map((tag) => (
              <span
                key={tag.id}
                className="group inline-flex items-center gap-1 rounded-md px-2 py-0.5 tt-meta font-medium transition-colors"
                style={{
                  backgroundColor: `${tag.color || "#4772fa"}20`,
                  color: tag.color || "#4772fa",
                }}
              >
                <span>{tag.name}</span>
                <button
                  type="button"
                  onClick={() => handleToggleTag(tag.id)}
                  className="opacity-60 hover:opacity-100 cursor-pointer"
                  title="Remove tag"
                >
                  <XIcon className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}

            {/* Add Tag Popover */}
            <Popover open={showTagPicker} onOpenChange={setShowTagPicker}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--tt-panel-alt)] border border-[var(--tt-border)] text-[var(--tt-muted)] hover:text-[var(--tt-text)] hover:border-[var(--tt-accent)] transition-colors cursor-pointer"
                  title="Add tag"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={6}
                className="w-52 p-2 bg-[var(--tt-panel)] border-[var(--tt-border)] text-[var(--tt-text)] rounded-xl shadow-xl z-50"
              >
                {/* Search / Create Tag Input */}
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[var(--tt-panel-alt)] border border-[var(--tt-border)] mb-2">
                  <TagIcon className="h-3.5 w-3.5 text-[var(--tt-muted)] shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tagSearch.trim()) {
                        e.preventDefault();
                        handleCreateTag();
                      }
                    }}
                    placeholder="Find or create tag..."
                    className="w-full bg-transparent tt-meta text-xs text-[var(--tt-text)] placeholder-[var(--tt-muted)] focus:outline-none"
                  />
                </div>

                {/* Option to create new tag if typed name doesn't exist */}
                {tagSearch.trim() && !hasExactMatch && (
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    disabled={isCreatingTag}
                    className="w-full flex items-center gap-2 px-2 py-1.5 mb-1.5 rounded-lg text-xs font-medium text-[var(--tt-accent-text)] bg-[var(--tt-accent)]/10 hover:bg-[var(--tt-accent)]/20 transition-colors text-left cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Create &quot;{tagSearch.trim()}&quot;</span>
                  </button>
                )}

                {/* List of tags */}
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {filteredTags.map((t) => {
                    const isSelected = normalizedTagIds.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleToggleTag(t.id)}
                        className="group/item flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-[var(--tt-panel-alt)] transition-colors text-left cursor-pointer"
                      >
                        <span className="flex items-center gap-2 truncate flex-1 min-w-0">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: t.color || "#4772fa" }}
                          />
                          <span className="truncate">{t.name}</span>
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {isSelected && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTagToDelete({ id: t.id, name: t.name });
                            }}
                            title="Delete tag"
                            className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded text-[var(--tt-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {tags.length === 0 && !tagSearch.trim() && (
                    <div className="py-3 text-center tt-meta text-xs text-[var(--tt-muted)]">
                      Type above to create a tag
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Floating Sparkle Action Button */}
        <div className="absolute bottom-14 right-4 z-10">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full bg-[var(--tt-panel-alt)] border border-[var(--tt-border)] text-sky-400 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="AI & Smart Actions"
            onClick={() => {
              if (task && description) {
                // Example smart polish
                setTitle((t) => t.trim());
              }
            }}
          >
            <Sparkles className="size-4" />
          </button>
        </div>

        {/* Bottom Action Footer Bar */}
        <div className="flex items-center justify-between border-t border-[var(--tt-border)]/80 px-3 py-2 bg-[var(--tt-panel)]">
          {/* Left: List Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 tt-meta font-medium px-2 py-1 rounded-md text-[var(--tt-muted)] hover:text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)] transition-colors cursor-pointer"
              >
                <Folder
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: currentList?.color || undefined }}
                />
                <span className="truncate max-w-[100px]">
                  {currentList ? currentList.name : "Inbox"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-40 bg-[var(--tt-panel)] border-[var(--tt-border)] text-[var(--tt-text)]"
            >
              <DropdownMenuItem
                onClick={() => onUpdateTask({ taskId: task.id, listId: null })}
                className="cursor-pointer"
              >
                <Folder className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                <span>Inbox</span>
              </DropdownMenuItem>
              {lists.map((l) => (
                <DropdownMenuItem
                  key={l.id}
                  onClick={() => onUpdateTask({ taskId: task.id, listId: l.id })}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: l.color || "#4772fa" }}
                  />
                  <span>{l.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Right: Formatting, Activity & Options Menu */}
          <div className="flex items-center gap-1 text-[var(--tt-muted)]">
            <button
              type="button"
              className="p-1.5 rounded hover:text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)] transition-colors cursor-pointer"
              title="Formatting"
            >
              <Type className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              className="p-1.5 rounded hover:text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)] transition-colors cursor-pointer"
              title="Task activity"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>

            {/* Three Dots Menu (...) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 rounded hover:text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)] transition-colors cursor-pointer"
                  title="More actions"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-48 bg-[var(--tt-panel)] border-[var(--tt-border)] text-[var(--tt-text)]"
              >
                {/* Add Subtask */}
                <DropdownMenuItem
                  onClick={() => newSubtaskInputRef.current?.focus()}
                  className="cursor-pointer"
                >
                  <ListPlus className="h-4 w-4 mr-2" />
                  <span>Add Subtask</span>
                </DropdownMenuItem>

                {/* Pin / Unpin */}
                <DropdownMenuItem
                  onClick={() => onUpdateTask({ taskId: task.id, isPinned: !task.isPinned })}
                  className="cursor-pointer"
                >
                  <Pin className="h-4 w-4 mr-2" />
                  <span>{task.isPinned ? "Unpin task" : "Pin task"}</span>
                </DropdownMenuItem>

                {/* Tags */}
                <DropdownMenuItem
                  onClick={() => setShowTagPicker(true)}
                  className="cursor-pointer"
                >
                  <TagIcon className="h-4 w-4 mr-2" />
                  <span>Tags</span>
                </DropdownMenuItem>

                {/* Start Focus (Pomodoro) */}
                <DropdownMenuItem
                  onClick={() => {
                    if (context.setActiveModule) {
                      context.setActiveModule("pomodoro");
                    }
                  }}
                  className="cursor-pointer"
                >
                  <Timer className="h-4 w-4 mr-2 text-rose-400" />
                  <span>Start Focus</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-[var(--tt-border)]" />

                {/* Delete Task */}
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This task will be removed.`}
        onConfirm={() => {
          onDeleteTask(task.id);
          onClose();
        }}
      />

      {/* Delete Tag Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!tagToDelete}
        onOpenChange={(open) => !open && setTagToDelete(null)}
        title="Delete Tag"
        description={`Are you sure you want to delete #${tagToDelete?.name}? This tag will be removed from all associated tasks.`}
        onConfirm={() => {
          if (tagToDelete && context?.deleteTag) {
            const targetId = tagToDelete.id;
            setTagToDelete(null);
            setLocalTags((prev) => prev.filter((t) => t.id !== targetId));
            context.deleteTag(targetId);
          }
        }}
      />
    </>
  );
}
