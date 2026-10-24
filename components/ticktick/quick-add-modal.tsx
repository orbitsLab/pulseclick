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
  Mic,
  MicOff,
  Wand2,
  Repeat,
} from "lucide-react";
import { TaskList, Tag } from "@/hooks/use-ticktick";
import { getTodayISO, addDays, formatShortDate, parseISODate } from "@/lib/date-utils";
import { parseTaskInput } from "@/lib/nlp";
import { TaskDatePickerPopover } from "./task-date-picker-popover";
import { useTickTickContext } from "@/context/ticktick-context";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  lists: TaskList[];
  tags: Tag[];
  onAddTask: (newTask: {
    title: string;
    description?: string;
    listId?: string | null;
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
  const context = useTickTickContext();
  const today = getTodayISO();
  const tomorrow = addDays(today, 1);
  const defaultDueDate = context?.activeView === "tomorrow" ? tomorrow : today;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [listId, setListId] = useState<string>("inbox");
  const [dueDate, setDueDate] = useState<string>(defaultDueDate);
  const [endDate, setEndDate] = useState<string>("");
  const [dueTime, setDueTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Sync date when opening modal
  useEffect(() => {
    if (isOpen) {
      setDueDate(context?.activeView === "tomorrow" ? tomorrow : today);
      if (context?.activeListId) {
        setListId(context.activeListId);
      }
    }
  }, [isOpen, context?.activeView, context?.activeListId, today, tomorrow]);

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
  const [isListening, setIsListening] = useState(false);
  const manual = useRef<Set<string>>(new Set());
  const recognitionRef = useRef<any>(null);

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

  function toggleVoiceInput() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (transcript) handleTitleChange(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }

  async function handleSubmit(e: React.FormEvent) {
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

    await onAddTask({
      title: result.title || title.trim(),
      description: description.trim() || undefined,
      listId: listId === "inbox" ? null : listId,
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
    });

    setTitle("");
    setDescription("");
    setDueDate(defaultDueDate);
    setEndDate("");
    setDueTime("");
    setEndTime("");
    manual.current.clear();
    onClose();
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-rail)] text-[var(--tt-text)] shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--tt-border)] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--tt-accent-strong)] text-white font-bold tt-label">
              +
            </span>
            <h3 className="tt-heading font-semibold text-white">Quick Add Task</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--tt-muted)] hover:text-white hover:bg-[var(--tt-panel-alt)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                autoFocus
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="What would you like to accomplish?"
                className="flex-1 bg-transparent tt-title font-semibold text-white placeholder-[var(--tt-muted)] focus:outline-none"
              />
              <button
                type="button"
                onClick={toggleVoiceInput}
                aria-label={isListening ? "Stop dictation" : "Dictate a task"}
                title={isListening ? "Stop dictation" : "Dictate a task"}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${ isListening ? "bg-rose-500/20 text-rose-400" : "text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)] hover:text-white" }`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>

            {/* Natural language preview */}
            {(parsed.dueDate ||
              parsed.dueTime ||
              parsed.recurrence ||
              parsed.priority !== null ||
              parsed.tags?.length ||
              parsed.durationMinutes) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 tt-meta">
                <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-[var(--tt-muted)]">
                  <Wand2 className="h-3 w-3" />
                  Understood
                </span>
                {parsed.dueDate && (
                  <span className="rounded-md bg-[var(--tt-accent)]/15 px-1.5 py-0.5 font-semibold text-[var(--tt-accent-text)]">
                    {parsed.dueDate}
                  </span>
                )}
                {parsed.dueTime && (
                  <span className="rounded-md bg-[var(--tt-accent)]/15 px-1.5 py-0.5 font-semibold text-[var(--tt-accent-text)]">
                    {parsed.dueTime}
                  </span>
                )}
                {parsed.recurrence && parsed.recurrence !== "NONE" && (
                  <span className="flex items-center gap-1 rounded-md bg-violet-500/15 px-1.5 py-0.5 font-semibold text-violet-400">
                    <Repeat className="h-3 w-3" />
                    {parsed.recurrence.toLowerCase()}
                  </span>
                )}
                {parsed.priority !== null && parsed.priority !== undefined && (
                  <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-400">
                    P{parsed.priority}
                  </span>
                )}
                {parsed.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-indigo-500/15 px-1.5 py-0.5 font-semibold text-indigo-400"
                  >
                    #{tag}
                  </span>
                ))}
                {parsed.durationMinutes ? (
                  <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-emerald-400">
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
              className="w-full rounded-xl border border-[var(--tt-border)] bg-[var(--tt-bg)]/60 p-2.5 tt-label text-[var(--tt-text)] placeholder-[var(--tt-muted)] focus:border-[var(--tt-accent)] focus:outline-none"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 tt-label">
            <button
              type="button"
              onClick={() => setDueDate(today)}
              className={`rounded-lg px-2.5 py-1 tt-label font-medium transition-colors ${ dueDate === today ? "bg-[var(--tt-accent)]/20 text-[var(--tt-accent-text)] border border-[var(--tt-accent)]/40" : "bg-[var(--tt-panel-alt)] text-[var(--tt-muted)] hover:text-white" }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDueDate(addDays(today, 1))}
              className={`rounded-lg px-2.5 py-1 tt-label font-medium transition-colors ${ dueDate === addDays(today, 1) ? "bg-[var(--tt-accent)]/20 text-[var(--tt-accent-text)] border border-[var(--tt-accent)]/40" : "bg-[var(--tt-panel-alt)] text-[var(--tt-muted)] hover:text-white" }`}
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setDueDate(addDays(today, 7))}
              className={`rounded-lg px-2.5 py-1 tt-label font-medium transition-colors ${ dueDate === addDays(today, 7) ? "bg-[var(--tt-accent)]/20 text-[var(--tt-accent-text)] border border-[var(--tt-accent)]/40" : "bg-[var(--tt-panel-alt)] text-[var(--tt-muted)] hover:text-white" }`}
            >
              Next Week
            </button>
            <button
              type="button"
              onClick={() => setDueDate("")}
              className={`rounded-lg px-2 py-1 tt-label transition-colors ${ !dueDate ? "bg-[var(--tt-panel-alt)] text-white" : "text-[var(--tt-muted)] hover:text-[var(--tt-muted)]" }`}
            >
              No Date
            </button>
          </div>

          {/* Attributes Grid */}
          <div className="grid grid-cols-2 gap-3 tt-label pt-1">
            {/* Due Date & Time */}
            <div className="col-span-2 relative" ref={datePickerRef}>
              <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
                Due Date &amp; Time
              </label>
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--tt-border)] bg-[var(--tt-bg)] px-3 py-2 tt-label text-white hover:bg-[var(--tt-panel-alt)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--tt-muted)]" />
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
                      <span className="text-[var(--tt-muted)]">No date set</span>
                    )}
                  </span>
                </div>
                {dueDate && (
                  <X
                    className="h-3.5 w-3.5 text-[var(--tt-muted)] hover:text-rose-400"
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
              <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
                Target List
              </label>
              <select
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                className="w-full rounded-xl border border-[var(--tt-border)] bg-[var(--tt-bg)] px-2.5 py-1.5 tt-label text-white focus:outline-none focus:border-[var(--tt-accent)]"
              >
                <option value="inbox">📥 Inbox</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    📁 {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--tt-border)] bg-[var(--tt-bg)] px-2.5 py-1.5 tt-label text-white focus:outline-none focus:border-[var(--tt-accent)]"
              >
                <option value="0">⚪ None</option>
                <option value="1">🔵 Low Priority</option>
                <option value="2">🟡 Medium Priority</option>
                <option value="3">🔴 High Priority</option>
              </select>
            </div>

            {/* Recurrence & Reminder */}
            <div>
              <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
                Repeat
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full rounded-xl border border-[var(--tt-border)] bg-[var(--tt-bg)] px-2.5 py-1.5 tt-label text-white focus:outline-none focus:border-[var(--tt-accent)]"
              >
                <option value="NONE">Never</option>
                <option value="DAILY">🔁 Daily</option>
                <option value="WEEKLY">🔁 Weekly</option>
                <option value="MONTHLY">🔁 Monthly</option>
              </select>
            </div>

            <div>
              <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
                Reminder
              </label>
              <select
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className="w-full rounded-xl border border-[var(--tt-border)] bg-[var(--tt-bg)] px-2.5 py-1.5 tt-label text-white focus:outline-none focus:border-[var(--tt-accent)]"
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
              <label className="block tt-overline font-semibold text-[var(--tt-muted)] mb-1">
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
                      className={`rounded-full px-2.5 py-0.5 tt-label font-medium transition-all ${ isSelected ? "bg-indigo-500 text-white shadow-xs" : "border border-[var(--tt-border)] bg-[var(--tt-bg)] text-[var(--tt-muted)] hover:text-white" }`}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--tt-border)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-3.5 py-1.5 tt-label text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[var(--tt-accent-strong)] px-4 py-1.5 tt-label font-semibold text-white shadow-md shadow-[var(--tt-accent)]/25 hover:bg-[var(--tt-accent-strong)] transition-all active:scale-95"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
