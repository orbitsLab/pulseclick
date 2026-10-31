"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  Flag,
  Folder,
  Tag as TagIcon,
  Bell,
  Plus,
  Wand2,
  Repeat,
} from "lucide-react";
import { TaskList, Tag } from "@/hooks/use-workspace";
import { getTodayISO, addDays, formatShortDate, parseISODate } from "@/lib/date-utils";
import { parseTaskInput } from "@/lib/nlp";
import { TaskDatePickerPopover } from "./task-date-picker-popover";
import { useWorkspaceContext } from "@/context/workspace-context";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  lists: TaskList[];
  tags: Tag[];
  onAddTask: (newTask: {
    title: string;
    description?: string;
    listId?: string | null;
    groupId?: string | null;
    dueDate?: string | null;
    dueTime?: string | null;
    priority?: number;
    recurrence?: string;
    recurrenceInterval?: number;
    recurrenceWeekdays?: string | null;
    reminder?: string;
    tags?: string[];
    durationMinutes?: number;
    startDate?: string | null;
    endDate?: string | null;
    endTime?: string | null;
  }) => Promise<any>;
}

export function QuickAddModal({
  isOpen,
  onClose,
  lists,
  tags,
  onAddTask,
}: QuickAddModalProps) {
  const context = useWorkspaceContext();
  const today = getTodayISO();
  const tomorrow = addDays(today, 1);
  const defaultDueDate = context?.activeView === "tomorrow" ? tomorrow : today;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [listId, setListId] = useState<string>("inbox");
  const [groupId, setGroupId] = useState<string | null>(() => context?.activeGroupId ?? null);
  const [dueDate, setDueDate] = useState<string>(defaultDueDate);
  const [endDate, setEndDate] = useState<string>("");
  const [dueTime, setDueTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const availableGroups = useMemo(() => {
    if (!listId || listId === "inbox") return [];
    return (context?.taskGroups || []).filter((g) => g.listId === listId);
  }, [listId, context?.taskGroups]);

  // Sync date and default list when opening modal
  useEffect(() => {
    if (isOpen) {
      setDueDate(context?.activeView === "tomorrow" ? tomorrow : today);
      if (context?.activeListId) {
        setListId(context.activeListId);
        setGroupId(context?.activeGroupId ?? null);
      } else if (context?.activeGroupId) {
        const group = (context?.taskGroups || []).find((g) => g.id === context.activeGroupId);
        if (group) {
          setListId(group.listId);
          setGroupId(group.id);
        }
      }
    }
  }, [isOpen, context?.activeView, context?.activeListId, context?.activeGroupId, context?.taskGroups, today, tomorrow]);

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
  const [priority, setPriority] = useState<number>(0);
  const [recurrence, setRecurrence] = useState<string>("NONE");
  const [reminder, setReminder] = useState<string>("NONE");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const manual = useRef<Set<string>>(new Set());

  const parsed = useMemo(() => parseTaskInput(title), [title]);

  if (!isOpen) return null;

  function handleTitleChange(value: string) {
    setTitle(value);
    const result = parseTaskInput(value);
    if (result.dueDate && !manual.current.has("dueDate")) setDueDate(result.dueDate);
    if (result.dueTime && !manual.current.has("dueTime")) setDueTime(result.dueTime);
    if (result.priority !== undefined && result.priority !== null && !manual.current.has("priority")) {
      setPriority(result.priority);
    }
    if (result.recurrence && !manual.current.has("recurrence")) setRecurrence(result.recurrence);
    if (result.tags?.length) {
      setSelectedTagIds((prev) => {
        const next = [...prev];
        for (const name of result.tags!) {
          const match = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
          if (match && !next.includes(match.id)) next.push(match.id);
        }
        return next;
      });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const result = parseTaskInput(title);

    let durationMinutes = result.durationMinutes ?? undefined;
    if (dueDate && endDate && endDate !== dueDate) {
      const start = parseISODate(dueDate);
      const end = parseISODate(endDate);
      if (start && end) {
        const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
        durationMinutes = diff * 24 * 60;
      }
    }

    const payload = {
      title: result.title || title.trim(),
      description: description.trim() || undefined,
      listId: listId === "inbox" ? null : listId,
      groupId: listId === "inbox" ? null : (groupId || null),
      dueDate: endDate || dueDate || null,
      startDate: dueDate || null,
      endDate: endDate || null,
      dueTime: dueTime || null,
      endTime: endTime || null,
      priority,
      recurrence,
      recurrenceInterval: result.recurrenceInterval ?? 1,
      recurrenceWeekdays: result.recurrenceWeekdays ?? null,
      reminder,
      tags: selectedTagIds,
      durationMinutes,
    };

    // Close modal and reset fields immediately for instant responsive feel
    setTitle("");
    setDescription("");
    setDueDate(defaultDueDate);
    setEndDate("");
    setDueTime("");
    setEndTime("");
    manual.current.clear();
    onClose();

    // Trigger optimistic background sync
    Promise.resolve(onAddTask(payload)).catch(() => {});
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg overflow-hidden rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-text)] shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--app-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-[3px] bg-[var(--app-accent)] text-white font-semibold text-xs">
              +
            </span>
            <h3 className="text-sm font-semibold text-[var(--app-text)]">Quick Add Task</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[4px] p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                autoFocus
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="What would you like to accomplish?"
                className="flex-1 bg-transparent text-sm font-medium text-[var(--app-text)] placeholder-[var(--app-muted)] focus:outline-none"
              />
            </div>

            {/* Natural language preview */}
            {(parsed.dueDate ||
              parsed.dueTime ||
              parsed.recurrence ||
              parsed.priority !== null ||
              parsed.tags?.length ||
              parsed.durationMinutes) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                  <Wand2 className="h-3 w-3" />
                  Understood
                </span>
                {parsed.dueDate && (
                  <span className="rounded-[3px] bg-[rgba(35,131,226,0.12)] text-[#2383e2] dark:text-[#529cca] border border-[rgba(35,131,226,0.25)] px-1.5 py-0.2 font-mono text-[11px]">
                    {parsed.dueDate}
                  </span>
                )}
                {parsed.dueTime && (
                  <span className="rounded-[3px] bg-[rgba(35,131,226,0.12)] text-[#2383e2] dark:text-[#529cca] border border-[rgba(35,131,226,0.25)] px-1.5 py-0.2 font-mono text-[11px]">
                    {parsed.dueTime}
                  </span>
                )}
                {parsed.recurrence && parsed.recurrence !== "NONE" && (
                  <span className="flex items-center gap-1 rounded-[3px] bg-[rgba(144,101,176,0.12)] text-[#9065b0] dark:text-[#9a6dd7] border border-[rgba(144,101,176,0.25)] px-1.5 py-0.2 text-[11px]">
                    <Repeat className="h-3 w-3" />
                    {parsed.recurrence.toLowerCase()}
                  </span>
                )}
                {parsed.priority !== null && parsed.priority !== undefined && (
                  <span className="rounded-[3px] bg-[rgba(203,145,47,0.1)] text-[#dfab01] dark:text-[#f3cd46] border border-[rgba(203,145,47,0.25)] px-1.5 py-0.2 text-[11px] font-mono">
                    P{parsed.priority}
                  </span>
                )}
                {parsed.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-[3px] bg-[rgba(35,131,226,0.1)] text-[#2383e2] dark:text-[#529cca] border border-[rgba(35,131,226,0.25)] px-1.5 py-0.2 text-[11px]"
                  >
                    #{tag}
                  </span>
                ))}
                {parsed.durationMinutes ? (
                  <span className="rounded-[3px] bg-[rgba(68,131,97,0.1)] text-[#448361] dark:text-[#4dab9a] border border-[rgba(68,131,97,0.25)] px-1.5 py-0.2 text-[11px] font-mono">
                    {parsed.durationMinutes}m
                  </span>
                ) : null}
              </div>
            )}
          </div>

          <div>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description, notes, or checklist items..."
              className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] p-2 text-xs text-[var(--app-text)] placeholder-[var(--app-muted)] focus:border-[var(--app-accent)] focus:outline-none"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setDueDate(today)}
              className={`rounded-[3px] px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer ${ dueDate === today ? "bg-[rgba(35,131,226,0.12)] text-[#2383e2] dark:text-[#529cca] border border-[rgba(35,131,226,0.25)]" : "bg-[var(--app-panel)] border border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)]" }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDueDate(addDays(today, 1))}
              className={`rounded-[3px] px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer ${ dueDate === addDays(today, 1) ? "bg-[rgba(35,131,226,0.12)] text-[#2383e2] dark:text-[#529cca] border border-[rgba(35,131,226,0.25)]" : "bg-[var(--app-panel)] border border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)]" }`}
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setDueDate(addDays(today, 7))}
              className={`rounded-[3px] px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer ${ dueDate === addDays(today, 7) ? "bg-[rgba(35,131,226,0.12)] text-[#2383e2] dark:text-[#529cca] border border-[rgba(35,131,226,0.25)]" : "bg-[var(--app-panel)] border border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)]" }`}
            >
              Next Week
            </button>
            <button
              type="button"
              onClick={() => setDueDate("")}
              className={`rounded-[3px] px-2 py-0.5 text-xs transition-colors cursor-pointer ${ !dueDate ? "bg-[var(--app-hover)] text-[var(--app-text)] border border-[var(--app-border)]" : "border border-transparent text-[var(--app-muted)] hover:text-[var(--app-muted)]" }`}
            >
              No Date
            </button>
          </div>

          {/* Attributes Grid */}
          <div className="grid grid-cols-2 gap-3 app-label pt-1">
            {/* Due Date & Time */}
            <div className="col-span-2 relative" ref={datePickerRef}>
              <label className="block app-overline font-semibold text-[var(--app-muted)] mb-1">
                Due Date &amp; Time
              </label>
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex w-full items-center justify-between rounded-[4px] border border-[var(--app-border)] bg-[var(--app-canvas)] px-2.5 py-1.5 text-xs text-[var(--app-text)] hover:bg-[var(--app-panel-hover)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--app-muted)]" />
                  <span>
                    {dueDate && endDate && endDate !== dueDate ? (
                      <span className="font-semibold text-primary">
                        {formatShortDate(dueDate)} – {formatShortDate(endDate)}
                        <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono font-medium">
                          {Math.round((parseISODate(endDate).getTime() - parseISODate(dueDate).getTime()) / 86400000) + 1}d
                        </span>
                      </span>
                    ) : dueDate ? (
                      <>
                        <span className="font-medium">
                          {dueDate === today
                            ? "Today"
                            : dueDate === tomorrow
                            ? "Tomorrow"
                            : formatShortDate(dueDate)}
                        </span>
                        {dueTime && <span className="opacity-75 font-mono ml-1.5">@{dueTime}</span>}
                      </>
                    ) : (
                      <span className="text-[var(--app-muted)]">No date set</span>
                    )}
                  </span>
                </div>
                {dueDate && (
                  <X
                    className="h-3.5 w-3.5 text-[var(--app-muted)] hover:text-rose-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDueDate("");
                      setEndDate("");
                      setDueTime("");
                      setEndTime("");
                    }}
                  />
                )}
              </button>

              {showDatePicker && (
                <div className="absolute left-0 top-16 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <TaskDatePickerPopover
                    dueDate={dueDate || null}
                    endDate={endDate || null}
                    dueTime={dueTime || null}
                    endTime={endTime || null}
                    defaultMode={endDate && endDate !== dueDate ? "range" : "single"}
                    onSelect={(d, t, endD, endT) => {
                      setDueDate(d || "");
                      setDueTime(t || "");
                      setEndDate(endD || "");
                      setEndTime(endT || "");
                    }}
                    onClose={() => setShowDatePicker(false)}
                  />
                </div>
              )}
            </div>

            {/* List & Priority */}
            <div>
              <label className="block app-overline font-semibold text-[var(--app-muted)] mb-1">
                Target List
              </label>
              <select
                value={listId}
                onChange={(e) => {
                  setListId(e.target.value);
                  setGroupId(null);
                }}
                className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-canvas)] px-2.5 py-1.5 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)]"
              >
                <option value="inbox">📥 Inbox</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    📁 {l.name}
                  </option>
                ))}
              </select>
            </div>

            {availableGroups.length > 0 && (
              <div>
                <label className="block text-[11px] font-medium text-[var(--app-muted)] uppercase tracking-wider mb-1">
                  Group / Section
                </label>
                <select
                  value={groupId || ""}
                  onChange={(e) => setGroupId(e.target.value || null)}
                  className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-canvas)] px-2.5 py-1.5 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)]"
                >
                  <option value="">None (Ungrouped)</option>
                  {availableGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-[var(--app-muted)] uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-canvas)] px-2.5 py-1.5 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)]"
              >
                <option value="0">⚪ None</option>
                <option value="1">🔵 Low Priority</option>
                <option value="2">🟡 Medium Priority</option>
                <option value="3">🔴 High Priority</option>
              </select>
            </div>

            {/* Recurrence & Reminder */}
            <div>
              <label className="block app-overline font-semibold text-[var(--app-muted)] mb-1">
                Repeat
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)]"
              >
                <option value="NONE">Never</option>
                <option value="DAILY">🔁 Daily</option>
                <option value="WEEKLY">🔁 Weekly</option>
                <option value="MONTHLY">🔁 Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--app-muted)] uppercase tracking-wider mb-1">
                Reminder
              </label>
              <select
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)]"
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

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-[var(--app-muted)] uppercase tracking-wider mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-[3px] px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer ${ isSelected ? "bg-[rgba(35,131,226,0.12)] text-[#2383e2] dark:text-[#529cca] border border-[rgba(35,131,226,0.25)]" : "border border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)] hover:text-[var(--app-text)]" }`}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--app-border)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[4px] px-3 py-1 text-xs text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-[4px] bg-[var(--app-accent)] hover:bg-[var(--app-accent)]/90 px-3.5 py-1 text-xs font-medium text-white transition-colors cursor-pointer shadow-none"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
