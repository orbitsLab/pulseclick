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
  ChevronDown,
  Paperclip,
  FileText,
  Bookmark,
  ChevronRight,
  Check,
} from "lucide-react";
import { TaskList, Tag } from "@/hooks/use-workspace";
import { getTodayISO, addDays, formatShortDate, parseISODate } from "@/lib/date-utils";
import { parseTaskInput } from "@/lib/nlp";
import { WorkspaceContext } from "@/context/workspace-context";
import { TaskDatePickerPopover } from "./task-date-picker-popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
  const context = useContext(WorkspaceContext);
  const currentListName = props.currentListName ?? context?.currentListName ?? "Tasks";
  const currentListId = props.currentListId !== undefined ? props.currentListId : (context?.activeListId ?? null);
  const lists = props.lists ?? context?.lists ?? [];
  const tags = props.tags ?? context?.tags ?? [];
  const onAddTask = props.onAddTask ?? context?.addTask ?? (async () => {});

  const today = getTodayISO();
  const tomorrow = addDays(today, 1);

  function getDefaultDueDate(view?: string): string | null {
    if (view === "today") return today;
    if (view === "tomorrow") return tomorrow;
    return null;
  }

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(() => getDefaultDueDate(context?.activeView));
  const [endDate, setEndDate] = useState<string | null>(null);
  const [dueTime, setDueTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [priority, setPriority] = useState<number>(0);
  const [listId, setListId] = useState<string | null>(currentListId);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<string>("NONE");
  const [isListening, setIsListening] = useState(false);

  // Fields the user set by hand always win over the natural language parse.
  const manual = useRef<Set<string>>(new Set());
  const recognitionRef = useRef<any>(null);

  // Popover toggles
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  // Sync default date when active view changes (e.g. today -> tomorrow)
  useEffect(() => {
    if (!manual.current.has("dueDate") && !title.trim()) {
      setDueDate(getDefaultDueDate(context?.activeView));
      setEndDate(null);
    }
  }, [context?.activeView]);

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
    if (!title.trim()) return;

    const result = parseTaskInput(title);
    const cleanTitle = result.title || title.trim();

    // Snapshot form values for recovery if mutation fails
    const savedTitle = title;
    const savedDueDate = dueDate;
    const savedEndDate = endDate;
    const savedDueTime = dueTime;
    const savedEndTime = endTime;
    const savedPriority = priority;
    const savedTagIds = [...selectedTagIds];
    const savedRecurrence = recurrence;

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
    };

    // Synchronously clear inputs immediately so the user can instantly type the next task
    setTitle("");
    setDueDate(getDefaultDueDate(context?.activeView));
    setEndDate(null);
    setDueTime(null);
    setEndTime(null);
    setPriority(0);
    setSelectedTagIds([]);
    setRecurrence("NONE");
    manual.current.clear();
    setShowDatePicker(false);
    setIsDropdownOpen(false);

    // Non-blocking background sync with error rollback
    Promise.resolve(onAddTask(payload)).catch(() => {
      setTitle(savedTitle);
      setDueDate(savedDueDate);
      setEndDate(savedEndDate);
      setDueTime(savedDueTime);
      setEndTime(savedEndTime);
      setPriority(savedPriority);
      setSelectedTagIds(savedTagIds);
      setRecurrence(savedRecurrence);
    });
  }

  const targetList = lists.find((l) => l.id === (listId || currentListId));

  return (
    <div className="flex flex-col gap-2">
      {/* Main Single-line Input Bar (Image 4 & 5 Style) */}
      <form
        onSubmit={handleSubmit}
        className="group relative flex items-center justify-between rounded-xl border border-[var(--app-border)] bg-[var(--app-panel-alt)]/60 px-3.5 py-2.5 shadow-xs transition-all focus-within:border-[var(--app-accent)] focus-within:ring-1 focus-within:ring-[var(--app-accent)]"
      >
        <div className="flex flex-1 items-center gap-2.5 min-w-0">
          <Plus className="h-4 w-4 text-[var(--app-muted)] shrink-0" />
          <input
            type="text"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder={`Add task to "${targetList?.name || currentListName}", press Enter to save`}
            className="flex-1 bg-transparent app-body text-sm text-[var(--app-text)] placeholder-[var(--app-muted)]/70 focus:outline-none"
          />
        </div>

        {/* Right-side Controls: Voice, Date, and Menu Dropdown */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {/* Active Date Label Pill if set */}
          {dueDate && (
            <span className="flex items-center gap-1 rounded-md bg-[var(--app-accent)]/15 px-2 py-0.5 app-meta font-medium text-[var(--app-accent-text)]">
              <span>
                {dueDate === today ? "Today" : dueDate === tomorrow ? "Tomorrow" : formatShortDate(dueDate)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDueDate(null);
                  setEndDate(null);
                  setDueTime(null);
                  setEndTime(null);
                  manual.current.add("dueDate");
                }}
                className="hover:text-rose-400"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Voice Input */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            title={isListening ? "Stop dictation" : "Dictate a task"}
            aria-label={isListening ? "Stop dictation" : "Dictate a task"}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer",
              isListening
                ? "bg-rose-500/15 text-rose-500"
                : "text-[var(--app-muted)] hover:bg-[var(--app-panel)] hover:text-[var(--app-text)]"
            )}
          >
            {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </button>

          {/* Calendar Trigger */}
          <div className="relative" ref={datePickerContainerRef}>
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer",
                dueDate
                  ? "text-[var(--app-accent-text)] bg-[var(--app-accent)]/15"
                  : "text-[var(--app-muted)] hover:bg-[var(--app-panel)] hover:text-[var(--app-text)]"
              )}
              title="Set date"
            >
              <Calendar className="h-4 w-4" />
            </button>

            {/* Date Picker Popover */}
            {showDatePicker && (
              <div className="absolute right-0 top-full mt-2 z-50">
                <TaskDatePickerPopover
                  dueDate={dueDate}
                  endDate={endDate}
                  dueTime={dueTime}
                  endTime={endTime}
                  onSelect={(d, dt, ed, et) => {
                    manual.current.add("dueDate");
                    setDueDate(d);
                    setDueTime(dt);
                    setEndDate(ed || null);
                    setEndTime(et || null);
                    setShowDatePicker(false);
                  }}
                  onClose={() => setShowDatePicker(false)}
                />
              </div>
            )}
          </div>

          {/* Options Dropdown (Image 5 Pattern) */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--app-muted)] hover:bg-[var(--app-panel)] hover:text-[var(--app-text)] transition-colors cursor-pointer"
                title="Task options"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-[var(--app-panel)] border-[var(--app-border)] text-[var(--app-text)] p-2 shadow-xl"
            >
              {/* Priority Flags Header */}
              <div className="px-2 py-1.5">
                <span className="block app-overline font-semibold text-[var(--app-muted)] mb-1.5">
                  Priority
                </span>
                <div className="flex items-center justify-between gap-1">
                  {[
                    { level: 3, label: "High", color: "text-rose-500", bg: "hover:bg-rose-500/15" },
                    { level: 2, label: "Medium", color: "text-amber-500", bg: "hover:bg-amber-500/15" },
                    { level: 1, label: "Low", color: "text-sky-500", bg: "hover:bg-sky-500/15" },
                    { level: 0, label: "None", color: "text-[var(--app-muted)]", bg: "hover:bg-[var(--app-panel-alt)]" },
                  ].map((p) => (
                    <button
                      key={p.level}
                      type="button"
                      onClick={() => {
                        manual.current.add("priority");
                        setPriority(p.level);
                      }}
                      title={`${p.label} Priority`}
                      className={cn(
                        "flex h-8 w-11 items-center justify-center rounded-md border transition-all cursor-pointer",
                        p.color,
                        p.bg,
                        priority === p.level
                          ? "border-[var(--app-accent)] bg-[var(--app-accent)]/10 font-bold"
                          : "border-transparent"
                      )}
                    >
                      <Flag className={cn("h-4 w-4", p.level > 0 && "fill-current")} />
                    </button>
                  ))}
                </div>
              </div>

              <DropdownMenuSeparator className="bg-[var(--app-border)] my-1" />

              {/* List Selector Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <Folder className="h-4 w-4 mr-2" style={{ color: targetList?.color || undefined }} />
                  <span className="truncate flex-1">{targetList?.name || "Inbox"}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-[var(--app-panel)] border-[var(--app-border)] text-[var(--app-text)] min-w-36">
                  <DropdownMenuItem
                    onClick={() => {
                      setListId(null);
                    }}
                    className="cursor-pointer"
                  >
                    <Folder className="h-3.5 w-3.5 mr-2 text-slate-400" />
                    <span>Inbox</span>
                  </DropdownMenuItem>
                  {lists.map((l) => (
                    <DropdownMenuItem
                      key={l.id}
                      onClick={() => {
                        setListId(l.id);
                      }}
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: l.color || "#4772fa" }}
                        />
                        <span>{l.name}</span>
                      </span>
                      {listId === l.id && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Tags Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <TagIcon className="h-4 w-4 mr-2" />
                  <span>Tags</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-[var(--app-panel)] border-[var(--app-border)] text-[var(--app-text)] min-w-36">
                  {tags.length === 0 ? (
                    <div className="p-2 app-meta text-[var(--app-muted)]">No tags yet</div>
                  ) : (
                    tags.map((t) => {
                      const isSelected = selectedTagIds.includes(t.id);
                      return (
                        <DropdownMenuItem
                          key={t.id}
                          onClick={() => {
                            setSelectedTagIds((prev) =>
                              isSelected ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                            );
                          }}
                          className="cursor-pointer flex items-center justify-between"
                        >
                          <span className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: t.color || "#4772fa" }}
                            />
                            <span>{t.name}</span>
                          </span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Action items matching Image 5 */}
              <DropdownMenuItem className="cursor-pointer text-[var(--app-muted)]">
                <Paperclip className="h-4 w-4 mr-2" />
                <span>Attachment</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer text-[var(--app-muted)]">
                <Bookmark className="h-4 w-4 mr-2" />
                <span>Add from Template</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer text-[var(--app-muted)]">
                <FileText className="h-4 w-4 mr-2" />
                <span>Convert to Note</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </form>

      {/* Natural Language Understood Preview Bar */}
      {(parsed.dueDate ||
        parsed.dueTime ||
        parsed.recurrence ||
        (parsed.priority !== null && parsed.priority !== undefined) ||
        parsed.tags?.length ||
        parsed.durationMinutes) && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 app-meta animate-in fade-in duration-150">
          <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-[var(--app-muted)]">
            <Wand2 className="h-3 w-3" />
            Understood
          </span>
          {parsed.dueDate && (
            <span className="rounded-md bg-[var(--app-accent)]/10 px-1.5 py-0.5 font-semibold text-[var(--app-accent-text)]">
              {parsed.dueDate}
            </span>
          )}
          {parsed.dueTime && (
            <span className="rounded-md bg-[var(--app-accent)]/10 px-1.5 py-0.5 font-semibold text-[var(--app-accent-text)]">
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
    </div>
  );
}
