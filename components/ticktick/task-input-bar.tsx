"use client";

import React, { useMemo, useRef, useState, useEffect, useContext } from "react";
import {
  Plus,
  Calendar,
  Flag,
  Folder,
  Tag as TagIcon,
  X,
  Mic,
  MicOff,
  Repeat,
  Wand2,
} from "lucide-react";
import { TaskList, Tag } from "@/hooks/use-ticktick";
import { getTodayISO, addDays, formatShortDate, parseISODate } from "@/lib/date-utils";
import { parseTaskInput } from "@/lib/nlp";
import { TickTickContext } from "@/context/ticktick-context";
import { TaskDatePickerPopover } from "./task-date-picker-popover";

interface TaskInputBarProps {
  currentListName?: string;
  currentListId?: string | null;
  lists?: TaskList[];
  tags?: Tag[];
  onAddTask?: (task: {
    title: string;
    listId?: string | null;
    dueDate?: string | null;
    dueTime?: string | null;
    priority?: number;
    tags?: string[];
    recurrence?: string;
    recurrenceInterval?: number;
    recurrenceWeekdays?: string | null;
    durationMinutes?: number;
    startDate?: string | null;
    endDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
  }) => Promise<any>;
}

export function TaskInputBar(props: TaskInputBarProps = {}) {
  const context = useContext(TickTickContext);
  const currentListName = props.currentListName ?? context?.currentListName ?? "Tasks";
  const currentListId = props.currentListId !== undefined ? props.currentListId : (context?.activeListId ?? null);
  const lists = props.lists ?? context?.lists ?? [];
  const tags = props.tags ?? context?.tags ?? [];
  const onAddTask = props.onAddTask ?? context?.addTask ?? (async () => {});

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [dueTime, setDueTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [priority, setPriority] = useState<number>(0);
  const [listId, setListId] = useState<string | null>(currentListId);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recurrence, setRecurrence] = useState<string>("NONE");
  const [isListening, setIsListening] = useState(false);

  // Fields the user set by hand always win over the natural language parse.
  const manual = useRef<Set<string>>(new Set());
  const recognitionRef = useRef<any>(null);

  // Popover toggles
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showListPicker, setShowListPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const datePickerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDatePicker) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        datePickerContainerRef.current &&
        !datePickerContainerRef.current.contains(e.target as Node)
      ) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDatePicker]);

  const today = getTodayISO();
  const tomorrow = addDays(today, 1);

  // Natural language parse of the current input.
  const parsed = useMemo(() => parseTaskInput(title), [title]);

  function handleTitleChange(val: string) {
    setTitle(val);
    const result = parseTaskInput(val);

    if (result.dueDate && !manual.current.has("dueDate")) {
      setDueDate(result.dueDate);
    }
    if (result.dueTime && !manual.current.has("dueTime")) {
      setDueTime(result.dueTime);
    }
    if (result.priority !== undefined && result.priority !== null && !manual.current.has("priority")) {
      setPriority(result.priority);
    }
    if (result.recurrence && !manual.current.has("recurrence")) {
      setRecurrence(result.recurrence);
    }
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
    if (!title.trim() || isSubmitting) return;

    const result = parseTaskInput(title);
    const cleanTitle = result.title || title.trim();

    setIsSubmitting(true);
    try {
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
        title: cleanTitle,
        listId: listId || currentListId,
        dueDate: endDate || dueDate,
        startDate: dueDate,
        endDate: endDate || null,
        dueTime,
        endTime: endTime || null,
        priority,
        tags: selectedTagIds,
        recurrence: recurrence !== "NONE" ? recurrence : undefined,
        recurrenceInterval: result.recurrenceInterval ?? 1,
        recurrenceWeekdays: result.recurrenceWeekdays ?? null,
        durationMinutes,
      });

      setTitle("");
      setDueDate(null);
      setEndDate(null);
      setDueTime(null);
      setEndTime(null);
      setPriority(0);
      setSelectedTagIds([]);
      setRecurrence("NONE");
      manual.current.clear();
      setShowDatePicker(false);
      setShowPriorityPicker(false);
      setShowListPicker(false);
      setShowTagPicker(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Priority color flags
  const priorityColors = [
    { level: 0, label: "No Priority", color: "text-[var(--tt-muted)]" },
    { level: 1, label: "Low Priority", color: "text-blue-400" },
    { level: 2, label: "Medium Priority", color: "text-amber-400" },
    { level: 3, label: "High Priority", color: "text-rose-500" },
  ];

  const targetList = lists.find((l) => l.id === (listId || currentListId));

  return (
    <div className="relative rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel)] p-3 shadow-sm transition-colors sm:p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5">
          <Plus className="h-4.5 w-4.5 text-[var(--tt-muted)] flex-shrink-0" />
          <input
            type="text"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder={`Add task to "${targetList?.name || currentListName}", press Enter to save`}
            className="flex-1 bg-transparent tt-body text-[var(--tt-text)] placeholder-[var(--tt-muted)] focus:outline-none"
          />
          <button
            type="button"
            onClick={toggleVoiceInput}
            title={isListening ? "Stop dictation" : "Dictate a task"}
            aria-label={isListening ? "Stop dictation" : "Dictate a task"}
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${ isListening ? "bg-rose-500/15 text-rose-500" : "text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)] hover:text-[var(--tt-text)] dark:hover:text-[var(--tt-text)]" }`}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        </div>

        {/* Natural language preview */}
        {(parsed.dueDate ||
          parsed.dueTime ||
          parsed.recurrence ||
          parsed.priority !== null &&
            parsed.priority !== undefined ||
          parsed.tags?.length ||
          parsed.durationMinutes) && (
          <div className="flex flex-wrap items-center gap-1.5 tt-meta">
            <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-[var(--tt-muted)]">
              <Wand2 className="h-3 w-3" />
              Understood
            </span>
            {parsed.dueDate && (
              <span className="rounded-md bg-[var(--tt-accent)]/10 px-1.5 py-0.5 font-semibold text-[var(--tt-accent-text)]">
                {parsed.dueDate}
              </span>
            )}
            {parsed.dueTime && (
              <span className="rounded-md bg-[var(--tt-accent)]/10 px-1.5 py-0.5 font-semibold text-[var(--tt-accent-text)]">
                {parsed.dueTime}
              </span>
            )}
            {parsed.recurrence && parsed.recurrence !== "NONE" && (
              <span className="flex items-center gap-1 rounded-md bg-violet-500/10 px-1.5 py-0.5 font-semibold text-violet-500">
                <Repeat className="h-3 w-3" />
                {parsed.recurrence.toLowerCase()}
                {parsed.recurrenceInterval && parsed.recurrenceInterval > 1
                  ? ` ×${parsed.recurrenceInterval}`
                  : ""}
              </span>
            )}
            {parsed.priority !== null && parsed.priority !== undefined && (
              <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 font-semibold text-amber-500">
                P{parsed.priority}
              </span>
            )}
            {parsed.tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-indigo-500/10 px-1.5 py-0.5 font-semibold text-indigo-500"
              >
                #{tag}
              </span>
            ))}
            {parsed.durationMinutes ? (
              <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-semibold text-emerald-500">
                {parsed.durationMinutes}m
              </span>
            ) : null}
          </div>
        )}

        {/* Quick action pill buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--tt-border)] pt-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Due Date Trigger */}
            <div className="relative" ref={datePickerContainerRef}>
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 tt-label font-medium transition-colors ${ dueDate ? "bg-[var(--tt-accent)]/15 text-[var(--tt-accent-text)] dark:text-[var(--tt-accent-text)] font-semibold" : "text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)] dark:text-[var(--tt-muted)] dark:hover:bg-[var(--tt-panel-alt)]" }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {dueDate && endDate && endDate !== dueDate ? (
                    `${formatShortDate(dueDate)} – ${formatShortDate(endDate)}`
                  ) : dueDate === today ? (
                    "Today"
                  ) : dueDate === tomorrow ? (
                    "Tomorrow"
                  ) : dueDate ? (
                    formatShortDate(dueDate)
                  ) : (
                    "Date"
                  )}
                </span>
                {dueDate && endDate && endDate !== dueDate && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--tt-accent)]/20 text-[var(--tt-accent-text)] font-mono font-medium">
                    {Math.round((parseISODate(endDate).getTime() - parseISODate(dueDate).getTime()) / 86400000) + 1}d
                  </span>
                )}
                {dueTime && <span className="opacity-75 font-mono text-xs">@{dueTime}</span>}
                {dueDate && (
                  <X
                    className="h-3 w-3 hover:text-rose-400 ml-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDueDate(null);
                      setEndDate(null);
                      setDueTime(null);
                      setEndTime(null);
                    }}
                  />
                )}
              </button>

              {showDatePicker && (
                <div className="absolute left-0 top-9 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <TaskDatePickerPopover
                    dueDate={dueDate}
                    endDate={endDate}
                    dueTime={dueTime}
                    endTime={endTime}
                    defaultMode={endDate && endDate !== dueDate ? "range" : "single"}
                    onSelect={(d, t, endD, endT) => {
                      manual.current.add("dueDate");
                      if (t) manual.current.add("dueTime");
                      setDueDate(d);
                      setDueTime(t);
                      setEndDate(endD ?? null);
                      setEndTime(endT ?? null);
                    }}
                    onClose={() => setShowDatePicker(false)}
                  />
                </div>
              )}
            </div>

            {/* Priority Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPriorityPicker(!showPriorityPicker)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 tt-label font-medium transition-colors ${ priority > 0 ? priority === 3 ? "bg-rose-500/15 text-rose-500 font-bold" : priority === 2 ? "bg-amber-500/15 text-amber-500 font-bold" : "bg-blue-500/15 text-blue-400 font-bold" : "text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)] dark:text-[var(--tt-muted)] dark:hover:bg-[var(--tt-panel-alt)]" }`}
              >
                <Flag className="h-3.5 w-3.5" />
                <span>{priority === 0 ? "Priority" : `P${4 - priority}`}</span>
              </button>

              {showPriorityPicker && (
                <div className="absolute left-0 top-8 z-30 w-36 rounded-xl border border-[var(--tt-border)] bg-[var(--tt-rail)] p-1.5 shadow-xl tt-label space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                  {priorityColors.map((p) => (
                    <button
                      key={p.level}
                      type="button"
                      onClick={() => {
                        manual.current.add("priority");
                        setPriority(p.level);
                        setShowPriorityPicker(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--tt-panel-alt)] font-medium ${p.color}`}
                    >
                      <Flag className="h-3.5 w-3.5" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* List Selector Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowListPicker(!showListPicker)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 tt-label font-medium transition-colors ${ targetList ? "bg-[var(--tt-accent)]/15 text-[var(--tt-accent-text)]" : "text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)] dark:text-[var(--tt-muted)] dark:hover:bg-[var(--tt-panel-alt)]" }`}
              >
                <Folder className="h-3.5 w-3.5" />
                <span>{targetList ? targetList.name : "Inbox"}</span>
              </button>

              {showListPicker && (
                <div className="absolute left-0 top-8 z-30 w-44 rounded-xl border border-[var(--tt-border)] bg-[var(--tt-rail)] p-1.5 shadow-xl tt-label space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setListId(null);
                      setShowListPicker(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--tt-panel-alt)] text-[var(--tt-muted)]"
                  >
                    <span>📥 Inbox</span>
                  </button>
                  {lists.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        setListId(l.id);
                        setShowListPicker(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--tt-panel-alt)] text-[var(--tt-muted)]"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                      <span className="truncate">{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tag Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTagPicker(!showTagPicker)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 tt-label font-medium transition-colors ${ selectedTagIds.length > 0 ? "bg-indigo-500/15 text-indigo-400 font-bold" : "text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)] dark:text-[var(--tt-muted)] dark:hover:bg-[var(--tt-panel-alt)]" }`}
              >
                <TagIcon className="h-3.5 w-3.5" />
                <span>{selectedTagIds.length > 0 ? `${selectedTagIds.length} tags` : "Tag"}</span>
              </button>

              {showTagPicker && (
                <div className="absolute left-0 top-8 z-30 w-44 rounded-xl border border-[var(--tt-border)] bg-[var(--tt-rail)] p-2 shadow-xl tt-label space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  {tags.length === 0 ? (
                    <div className="tt-meta text-[var(--tt-muted)] py-1">No tags created yet</div>
                  ) : (
                    tags.map((t) => {
                      const isSelected = selectedTagIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedTagIds((prev) =>
                              isSelected ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                            );
                          }}
                          className={`flex w-full items-center justify-between rounded-lg p-1.5 tt-label transition-colors ${ isSelected ? "bg-indigo-500/25 text-indigo-300 font-bold" : "text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)]" }`}
                        >
                          <span style={{ color: t.color }}>#{t.name}</span>
                          {isSelected && <span>✓</span>}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline tt-label text-[var(--tt-muted)] italic">
              Tip: type "today", "!high", or "#tag"
            </span>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="rounded-xl bg-[var(--tt-accent-strong)] px-4 py-1.5 tt-label font-semibold text-white shadow-md shadow-[var(--tt-accent)]/20 hover:bg-[var(--tt-accent-strong)] active:scale-95 disabled:opacity-40 transition-all"
            >
              Add Task
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
