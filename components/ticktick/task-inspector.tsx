"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Calendar,
  Flag,
  Folder,
  Tag as TagIcon,
  Trash2,
  Pin,
  Repeat,
  Plus,
  Clock,
  Bell,
} from "lucide-react";
import { Task, TaskList, Tag, TaskReminder, ListMember } from "@/hooks/use-ticktick";
import { getTodayISO, addDays, formatFullDate } from "@/lib/date-utils";
import { TaskReminders } from "./task-reminders";
import { CollaboratorsPanel } from "./collaborators-panel";

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
  reminders = [],
  members = [],
  assignees = [],
  onCreateReminder,
  onUpdateReminder,
  onDeleteReminder,
  onInviteMember,
  onUpdateMember,
  onRemoveMember,
  onAssign,
}: TaskInspectorProps) {
  if (!task) return null;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
  }, [task.id, task.title, task.description]);

  const today = getTodayISO();

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

  function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault();
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
    const currentTagIds = task!.tags?.map((t) => t.tagId) || [];
    const nextTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId];

    onUpdateTask({ taskId: task!.id, tags: nextTagIds as any });
  }

  return (
    <aside className="flex flex-col h-full w-80 md:w-96 border-l border-[var(--tt-border)] bg-[var(--tt-panel)] shadow-xl z-20 flex-shrink-0 animate-in slide-in-from-right duration-200">
      {/* Top action header */}
      <div className="flex items-center justify-between border-b border-[var(--tt-border)] p-3.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onUpdateTask({ taskId: task.id, completed: !task.completed })}
            className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${ task.completed ? "border-[var(--tt-accent)] bg-[var(--tt-accent-strong)] text-white" : "border-[var(--tt-border)] hover:border-[var(--tt-accent)]" }`}
          >
            {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
          </button>
          <span className="tt-label text-[var(--tt-muted)]">
            {task.completed ? "Completed" : "Mark Complete"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onUpdateTask({ taskId: task.id, isPinned: !task.isPinned })}
            title={task.isPinned ? "Unpin task" : "Pin task to top"}
            className={`rounded p-1.5 transition-colors ${ task.isPinned ? "text-amber-400" : "text-[var(--tt-muted)] hover:text-amber-400" }`}
          >
            <Pin className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              onDeleteTask(task.id);
              onClose();
            }}
            title="Delete task"
            className="rounded p-1.5 text-[var(--tt-muted)] hover:text-rose-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Close inspector"
            className="rounded p-1.5 text-[var(--tt-muted)] hover:text-[var(--tt-text)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Task title..."
          className="w-full bg-transparent tt-heading font-semibold text-[var(--tt-text)] focus:outline-none"
        />

        {/* Priority & Due Date Row */}
        <div className="grid grid-cols-2 gap-2 tt-label">
          {/* Priority dropdown */}
          <div>
            <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
              Priority
            </label>
            <select
              value={task.priority}
              onChange={(e) => onUpdateTask({ taskId: task.id, priority: Number(e.target.value) })}
              className="w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-2 py-1.5 tt-label text-[var(--tt-text)] focus:outline-none"
            >
              <option value="0">⚪ None</option>
              <option value="1">🔵 Low Priority</option>
              <option value="2">🟡 Medium Priority</option>
              <option value="3">🔴 High Priority</option>
            </select>
          </div>

          {/* List selector */}
          <div>
            <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
              List
            </label>
            <select
              value={task.listId || "inbox"}
              onChange={(e) => onUpdateTask({ taskId: task.id, listId: e.target.value })}
              className="w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-2 py-1.5 tt-label text-[var(--tt-text)] focus:outline-none"
            >
              <option value="inbox">📥 Inbox</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  📁 {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date & Recurrence Row */}
        <div className="grid grid-cols-2 gap-2 tt-label">
          <div>
            <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={task.dueDate || ""}
              onChange={(e) => onUpdateTask({ taskId: task.id, dueDate: e.target.value || null })}
              className="w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-2 py-1.5 tt-label text-[var(--tt-text)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
              Repeat
            </label>
            <select
              value={task.recurrence || "NONE"}
              onChange={(e) => onUpdateTask({ taskId: task.id, recurrence: e.target.value })}
              className="w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-2 py-1.5 tt-label text-[var(--tt-text)] focus:outline-none"
            >
              <option value="NONE">Never</option>
              <option value="DAILY">🔁 Daily</option>
              <option value="WEEKLY">🔁 Weekly</option>
              <option value="MONTHLY">🔁 Monthly</option>
              <option value="YEARLY">🔁 Yearly</option>
              <option value="CUSTOM">🔁 Custom</option>
            </select>
          </div>
        </div>

        {/* Recurrence detail: interval, weekdays, end date */}
        {task.recurrence && task.recurrence !== "NONE" && (
          <div className="grid grid-cols-2 gap-2 tt-label">
            <div>
              <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
                Every (n)
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={task.recurrenceInterval ?? 1}
                onChange={(e) =>
                  onUpdateTask({
                    taskId: task.id,
                    recurrenceInterval: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className="w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-2 py-1.5 tt-label text-[var(--tt-text)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
                Repeat until
              </label>
              <input
                type="date"
                value={task.recurrenceEndDate || ""}
                onChange={(e) =>
                  onUpdateTask({
                    taskId: task.id,
                    recurrenceEndDate: e.target.value || null,
                  })
                }
                className="w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-2 py-1.5 tt-label text-[var(--tt-text)] focus:outline-none"
              />
            </div>
            {(task.recurrence === "WEEKLY" || task.recurrence === "CUSTOM") && (
              <div className="col-span-2">
                <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
                  On these days
                </label>
                <div className="flex gap-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, index) => {
                    const selected = (task.recurrenceWeekdays || "")
                      .split(",")
                      .filter(Boolean)
                      .map(Number)
                      .includes(index);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          const current = (task.recurrenceWeekdays || "")
                            .split(",")
                            .filter(Boolean)
                            .map(Number);
                          const next = selected
                            ? current.filter((d) => d !== index)
                            : [...current, index].sort((a, b) => a - b);
                          onUpdateTask({
                            taskId: task.id,
                            recurrenceWeekdays: next.length ? next.join(",") : null,
                          });
                        }}
                        className={`flex-1 rounded-md border px-1 py-1 tt-meta font-bold transition-colors ${ selected ? "border-[var(--tt-accent)] bg-[var(--tt-accent-strong)] text-white" : "border-[var(--tt-border)] text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)] dark:border-[var(--tt-border)] dark:hover:bg-[var(--tt-panel-alt)]" }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Schedule (timeline) */}
        <div className="grid grid-cols-2 gap-2 tt-label">
          <div>
            <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
              Start date
            </label>
            <input
              type="date"
              value={task.startDate || ""}
              onChange={(e) =>
                onUpdateTask({ taskId: task.id, startDate: e.target.value || null })
              }
              className="w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-2 py-1.5 tt-label text-[var(--tt-text)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
              End date
            </label>
            <input
              type="date"
              value={task.endDate || ""}
              onChange={(e) =>
                onUpdateTask({ taskId: task.id, endDate: e.target.value || null })
              }
              className="w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-2 py-1.5 tt-label text-[var(--tt-text)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
              Start time
            </label>
            <input
              type="time"
              value={task.startTime || ""}
              onChange={(e) =>
                onUpdateTask({ taskId: task.id, startTime: e.target.value || null })
              }
              className="w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-2 py-1.5 tt-label text-[var(--tt-text)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
              Duration (min)
            </label>
            <input
              type="number"
              min={0}
              step={15}
              value={task.durationMinutes ?? 0}
              onChange={(e) =>
                onUpdateTask({
                  taskId: task.id,
                  durationMinutes: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-2 py-1.5 tt-label text-[var(--tt-text)] focus:outline-none"
            />
          </div>
        </div>

        {/* Due Time & Reminder Row */}
        <div className="grid grid-cols-2 gap-2 tt-label">
          <div>
            <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Time
            </label>
            <input
              type="time"
              value={task.dueTime || ""}
              onChange={(e) => onUpdateTask({ taskId: task.id, dueTime: e.target.value || null })}
              className="w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-2 py-1.5 tt-label text-[var(--tt-text)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1 flex items-center gap-1">
              <Bell className="h-3 w-3" /> Reminder
            </label>
            <select
              value={task.reminder || "NONE"}
              onChange={(e) => onUpdateTask({ taskId: task.id, reminder: e.target.value })}
              className="w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-2 py-1.5 tt-label text-[var(--tt-text)] focus:outline-none"
            >
              <option value="NONE">None</option>
              <option value="AT_TIME">🔔 At time of event</option>
              <option value="5_MIN">⏰ 5 mins before</option>
              <option value="15_MIN">⏰ 15 mins before</option>
              <option value="30_MIN">⏰ 30 mins before</option>
              <option value="1_HOUR">⏰ 1 hour before</option>
              <option value="1_DAY">📅 1 day before</option>
            </select>
          </div>
        </div>

        {/* Tags Selection */}
        <div>
          <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1.5">
            Tags
          </label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const isAttached = task.tags?.some((t) => t.tagId === tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggleTag(tag.id)}
                  className={`rounded-full px-2.5 py-0.5 tt-label font-medium transition-all ${ isAttached ? "bg-indigo-500 text-white shadow-xs" : "border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)] dark:bg-[var(--tt-bg)] dark:text-[var(--tt-muted)]" }`}
                >
                  #{tag.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subtasks / Checklist */}
        <div className="border-t border-[var(--tt-border)] pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="tt-overline font-semibold text-[var(--tt-muted)]">
              Subtasks ({task.subtasks?.filter((s) => s.completed).length || 0}/
              {task.subtasks?.length || 0})
            </span>
          </div>

          <div className="space-y-1.5">
            {task.subtasks?.map((subtask) => (
              <div
                key={subtask.id}
                className="group flex items-center justify-between gap-2 rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)]/50 p-2"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(subtask.id, !subtask.completed)}
                    className={`flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded border ${ subtask.completed ? "border-[var(--tt-accent)] bg-[var(--tt-accent-strong)] text-white" : "border-[var(--tt-border)] hover:border-[var(--tt-accent)]" }`}
                  >
                    {subtask.completed && <Check className="h-2.5 w-2.5" />}
                  </button>
                  <span
                    className={`tt-label truncate ${ subtask.completed ? "line-through text-[var(--tt-muted)]" : "text-[var(--tt-text)]" }`}
                  >
                    {subtask.title}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteSubtask(subtask.id)}
                  className="text-[var(--tt-muted)] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSubtask} className="mt-2 flex items-center gap-1.5">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="+ Add subtask, press Enter"
              className="flex-1 rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-2.5 py-1.5 tt-label text-[var(--tt-text)] placeholder-[var(--tt-muted)] focus:outline-none focus:border-[var(--tt-accent)]"
            />
          </form>
        </div>

        {/* Description / Notes */}
        <div className="border-t border-[var(--tt-border)] pt-3">
          <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1.5">
            Notes &amp; Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            rows={4}
            placeholder="Add detailed task notes, checklist links, or context..."
            className="w-full rounded-xl border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] p-2.5 tt-label text-[var(--tt-text)] placeholder-[var(--tt-muted)] focus:outline-none focus:border-[var(--tt-accent)]"
          />
        </div>

        {/* Focus stats for task */}
        {task.pomodoroCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 tt-label text-rose-400">
            <span className="text-base">🍅</span>
            <span>
              <strong>{task.pomodoroCount}</strong> focus sessions completed on this task (
              {task.pomodoroCount * 25} mins total)
            </span>
          </div>
        )}

        {/* Reminders */}
        {onCreateReminder && onUpdateReminder && onDeleteReminder && (
          <div className="border-t border-[var(--tt-border)] pt-3">
            <TaskReminders
              taskId={task.id}
              reminders={reminders}
              onCreate={onCreateReminder}
              onUpdate={onUpdateReminder}
              onDelete={onDeleteReminder}
            />
          </div>
        )}

        {/* Collaboration */}
        {onInviteMember && onUpdateMember && onRemoveMember && (
          <div className="border-t border-[var(--tt-border)] pt-3">
            <CollaboratorsPanel
              listId={task.listId || null}
              members={members}
              taskId={task.id}
              assignees={assignees}
              onInvite={onInviteMember}
              onUpdateMember={onUpdateMember}
              onRemoveMember={onRemoveMember}
              onAssign={onAssign}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
