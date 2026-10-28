"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  GripVertical,
  Plus,
} from "lucide-react";

export interface TimelineTask {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  startDate?: string | null;
  /** HH:mm */
  startTime?: string | null;
  /** YYYY-MM-DD */
  endDate?: string | null;
  /** HH:mm */
  endTime?: string | null;
  durationMinutes?: number | null;
  /** 0 none, 1 low, 2 medium, 3 high */
  priority: number;
  completed: boolean;
  kanbanStatus?: string;
  list?: { id: string; name: string; color?: string | null } | null;
}

export interface TimelineViewProps {
  tasks: TimelineTask[];
  onSelectTask: (taskId: string) => void;
  onUpdateTask: (updates: {
    taskId: string;
    startDate?: string | null;
    endDate?: string | null;
    durationMinutes?: number | null;
    startTime?: string | null;
    endTime?: string | null;
  }) => void;
  isLoading?: boolean;
}

/* ------------------------------------------------------------------ */
/* constants                                                           */
/* ------------------------------------------------------------------ */

const DAY_WIDTH = 44;
const MIN_WINDOW_DAYS = 14;
const MIN_BAR_WIDTH = 10;
const DRAG_THRESHOLD_PX = 3;
const ACCENT = "var(--app-accent, #4dabf7)";

const PRIORITY_COLORS: Record<number, string> = {
  3: "#ef4444",
  2: "#f59e0b",
  1: "#4772fa",
  0: "#94a3b8",
};

const PRIORITY_LABELS: Array<{ priority: number; label: string }> = [
  { priority: 3, label: "High" },
  { priority: 2, label: "Medium" },
  { priority: 1, label: "Low" },
  { priority: 0, label: "None" },
];

/* ------------------------------------------------------------------ */
/* date helpers                                                        */
/* ------------------------------------------------------------------ */

type DragMode = "move" | "resize-start" | "resize-end";

interface DragState {
  taskId: string;
  mode: DragMode;
  pointerStartX: number;
  delta: number;
  moved: boolean;
  clientX: number;
  clientY: number;
  pointerId: number;
}

interface Geometry {
  start: Date;
  end: Date;
  spanDays: number;
  durationMinutes: number;
}

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function weekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0m";
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = Math.round(minutes % 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (days === 0 && hours === 0 && rest > 0) parts.push(`${rest}m`);
  return parts.length > 0 ? parts.join(" ") : "0m";
}

/** Base geometry of a scheduled task, derived from dates + duration. */
function geometryOf(task: TimelineTask): Geometry | null {
  const start = toDate(task.startDate);
  if (!start) return null;

  const explicitEnd = toDate(task.endDate);

  if (explicitEnd) {
    const diff = differenceInCalendarDays(explicitEnd, start);
    const spanDays = Math.max(1, diff + 1);
    return {
      start,
      end: explicitEnd,
      spanDays,
      durationMinutes: spanDays * 1440,
    };
  }

  if (task.durationMinutes && task.durationMinutes > 0) {
    const spanDays = Math.max(1, Math.ceil(task.durationMinutes / 1440));
    return {
      start,
      end: addDays(start, spanDays - 1),
      spanDays,
      durationMinutes: task.durationMinutes,
    };
  }

  return {
    start,
    end: start,
    spanDays: 1,
    durationMinutes: 1440,
  };
}

/** Geometry after applying an in-flight drag. */
function previewGeometry(task: TimelineTask, drag: DragState): Geometry | null {
  const base = geometryOf(task);
  if (!base) return null;

  if (drag.mode === "move") {
    if (drag.delta === 0) return base;
    return {
      start: addDays(base.start, drag.delta),
      end: addDays(base.end, drag.delta),
      spanDays: base.spanDays,
      durationMinutes: base.durationMinutes,
    };
  }

  if (drag.mode === "resize-end") {
    let end = addDays(base.end, drag.delta);
    if (end < base.start) end = base.start;
    const spanDays = Math.max(1, differenceInCalendarDays(end, base.start) + 1);
    return {
      start: base.start,
      end,
      spanDays,
      durationMinutes: spanDays * 1440,
    };
  }

  // resize-start
  let start = addDays(base.start, drag.delta);
  if (start > base.end) start = base.end;
  const spanDays = Math.max(1, differenceInCalendarDays(base.end, start) + 1);
  return {
    start,
    end: base.end,
    spanDays,
    durationMinutes: spanDays * 1440,
  };
}

function barColor(task: TimelineTask): string {
  if (task.list?.color) return task.list.color;
  return PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS[0];
}

/* ------------------------------------------------------------------ */
/* component                                                           */
/* ------------------------------------------------------------------ */

export function TimelineView({ tasks, onSelectTask, onUpdateTask, isLoading }: TimelineViewProps) {
  const scheduled = useMemo(
    () => tasks.filter((task) => Boolean(task.startDate)),
    [tasks]
  );
  const unscheduled = useMemo(
    () => tasks.filter((task) => !task.startDate),
    [tasks]
  );

  const [anchor, setAnchor] = useState<Date>(() => {
    const earliest = scheduled
      .map((task) => toDate(task.startDate))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    return weekStart(earliest ?? new Date());
  });

  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const windowStart = anchor;
  const windowDays = useMemo(() => {
    let min: Date | null = null;
    let max: Date | null = null;
    for (const task of scheduled) {
      const geometry = geometryOf(task);
      if (!geometry) continue;
      if (!min || geometry.start < min) min = geometry.start;
      if (!max || geometry.end > max) max = geometry.end;
    }
    if (!min || !max) return MIN_WINDOW_DAYS;
    const span = differenceInCalendarDays(max, min) + 1;
    return Math.max(MIN_WINDOW_DAYS, Math.ceil(span / 7) * 7);
  }, [scheduled]);
  const windowEnd = addDays(anchor, windowDays - 1);
  const days = useMemo(
    () => Array.from({ length: windowDays }, (_, i) => addDays(anchor, i)),
    [anchor, windowDays]
  );

  const today = useMemo(() => new Date(), []);
  const todayOffset = differenceInCalendarDays(today, windowStart);
  const showTodayMarker = todayOffset >= 0 && todayOffset < windowDays;

  const setDragState = useCallback((next: DragState | null) => {
    dragRef.current = next;
    setDrag(next);
  }, []);

  const goPrev = useCallback(() => {
    setAnchor((prev) => addDays(prev, -7));
  }, []);

  const goNext = useCallback(() => {
    setAnchor((prev) => addDays(prev, 7));
  }, []);

  const goToday = useCallback(() => {
    setAnchor(weekStart(new Date()));
  }, []);

  /* -------------------------------------------------------------- */
  /* pointer interaction                                             */
  /* -------------------------------------------------------------- */

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, task: TimelineTask) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      const target = event.target as HTMLElement;
      const handle = target.closest("[data-drag-handle]");
      const handleMode = handle?.getAttribute("data-drag-handle");
      const mode: DragMode =
        handleMode === "start" ? "resize-start" : handleMode === "end" ? "resize-end" : "move";

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* pointer capture is best effort */
      }

      setDragState({
        taskId: task.id,
        mode,
        pointerStartX: event.clientX,
        delta: 0,
        moved: false,
        clientX: event.clientX,
        clientY: event.clientY,
        pointerId: event.pointerId,
      });
    },
    [setDragState]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, task: TimelineTask) => {
      const current = dragRef.current;
      if (!current || current.taskId !== task.id) return;

      const dx = event.clientX - current.pointerStartX;
      const delta = Math.round(dx / DAY_WIDTH);
      const moved = current.moved || Math.abs(dx) > DRAG_THRESHOLD_PX;

      setDragState({
        ...current,
        delta,
        moved,
        clientX: event.clientX,
        clientY: event.clientY,
      });
    },
    [setDragState]
  );

  const finishDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, task: TimelineTask) => {
      const current = dragRef.current;
      if (!current || current.taskId !== task.id) return;

      try {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      } catch {
        /* ignore */
      }

      if (!current.moved) {
        setDragState(null);
        onSelectTask(task.id);
        return;
      }

      const preview = previewGeometry(task, current);
      if (preview) {
        if (current.mode === "move") {
          onUpdateTask({
            taskId: task.id,
            startDate: toISO(preview.start),
            endDate: toISO(preview.end),
            durationMinutes: preview.durationMinutes,
          });
        } else if (current.mode === "resize-end") {
          onUpdateTask({
            taskId: task.id,
            endDate: toISO(preview.end),
            durationMinutes: preview.durationMinutes,
          });
        } else {
          onUpdateTask({
            taskId: task.id,
            startDate: toISO(preview.start),
            durationMinutes: preview.durationMinutes,
          });
        }
      }

      setDragState(null);
    },
    [onSelectTask, onUpdateTask, setDragState]
  );

  const cancelDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, task: TimelineTask) => {
      const current = dragRef.current;
      if (!current || current.taskId !== task.id) return;
      try {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      } catch {
        /* ignore */
      }
      setDragState(null);
    },
    [setDragState]
  );

  /* -------------------------------------------------------------- */
  /* render                                                          */
  /* -------------------------------------------------------------- */

  const rangeLabel = `${format(windowStart, "d MMM")} – ${format(windowEnd, "d MMM yyyy")}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] shadow-sm transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--app-border)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <CalendarDays className="h-5 w-5" style={{ color: ACCENT }} />
          <div className="flex flex-col">
            <h2 className="app-heading font-semibold text-[var(--app-text)] flex items-center gap-2">
              Timeline
              {isLoading && tasks.length === 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--app-panel-alt)] px-2 py-0.5 app-meta font-normal text-[var(--app-muted)] animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--app-accent)]" /> Syncing tasks…
                </span>
              )}
            </h2>
            <span className="app-label text-[var(--app-muted)]">{rangeLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-[var(--app-border)] bg-[var(--app-panel-alt)] px-3 py-1 app-label font-medium text-[var(--app-text)] transition-colors hover:bg-[var(--app-panel-alt)]"
            style={{ borderColor: "var(--app-border, currentColor)" }}
          >
            Today
          </button>
          <div className="flex items-center rounded-lg border border-[var(--app-border)] bg-[var(--app-panel-alt)]">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous week"
              className="p-1 text-[var(--app-text)] transition-colors hover:text-[var(--app-text)] dark:hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next week"
              className="p-1 text-[var(--app-text)] transition-colors hover:text-[var(--app-text)] dark:hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Unscheduled tray */}
      {unscheduled.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--app-border)] bg-[var(--app-panel-alt)]/70 px-4 py-2.5">
          <span className="flex items-center gap-1 app-meta font-semibold uppercase tracking-wide text-[var(--app-muted)]">
            <Plus className="h-3 w-3" />
            Unscheduled
          </span>
          {unscheduled.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onSelectTask(task.id)}
              className="group flex max-w-[220px] items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1 app-label text-[var(--app-text)] transition-colors hover:border-[var(--app-border)] hover:bg-[var(--app-panel-alt)]"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: barColor(task) }}
              />
              <span
                className={`truncate ${ task.completed ? "line-through opacity-60" : "" }`}
              >
                {task.title}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {scheduled.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
          <CalendarDays className="h-8 w-8 text-[var(--app-muted)]" />
          <p className="app-body font-semibold text-[var(--app-text)]">
            Nothing scheduled yet
          </p>
          <p className="max-w-xs app-label text-[var(--app-muted)]">
            Give a task a start date to see it laid out on the timeline.
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="flex w-max min-w-full">
            {/* Left: task names (sticky) */}
            <div className="sticky left-0 z-20 w-56 shrink-0 border-r border-[var(--app-border)] bg-[var(--app-panel)]">
              <div className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-[var(--app-border)] bg-[var(--app-panel)]/90 px-3 app-overline font-semibold tracking-wide text-[var(--app-muted)] backdrop-blur">
                <span>Task</span>
                <span className="rounded-full bg-[var(--app-panel-alt)] px-1.5 app-meta font-bold text-[var(--app-muted)]">
                  {scheduled.length}
                </span>
              </div>
              {scheduled.map((task) => (
                <div
                  key={task.id}
                  className="flex h-11 items-center gap-2 border-b border-[var(--app-border)] px-3"
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: barColor(task) }}
                  />
                  <button
                    type="button"
                    onClick={() => onSelectTask(task.id)}
                    title={task.title}
                    className={`truncate text-left app-heading font-semibold text-[var(--app-text)] hover:text-[var(--app-text)] hover:underline dark:text-[var(--app-muted)] dark:hover:text-white ${ task.completed ? "line-through opacity-60" : "" }`}
                  >
                    {task.title}
                  </button>
                  {task.completed && task.kanbanStatus === "WONT_DO" && (
                    <span className="inline-flex shrink-0 items-center rounded px-1 py-0.2 text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/25">
                      Won&apos;t Do
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Right: scrollable day grid */}
            <div
              className="relative shrink-0"
              style={{ width: windowDays * DAY_WIDTH }}
            >
              {/* Day header */}
              <div className="sticky top-0 z-10 flex h-12 divide-x divide-[var(--app-border)] border-b border-[var(--app-border)] bg-[var(--app-panel)]/80 backdrop-blur">
                {days.map((day) => {
                  const isToday = differenceInCalendarDays(day, today) === 0;
                  const isWeekend = [0, 6].includes(day.getDay());
                  return (
                    <div
                      key={toISO(day)}
                      className={`flex w-11 shrink-0 flex-col items-center justify-center text-center ${ isWeekend ? "bg-[var(--app-panel-alt)]/80 dark:bg-[var(--app-bg)]/40" : "" }`}
                    >
                      <span className="app-meta font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                        {format(day, "EEE")}
                      </span>
                      <span
                        className={`app-label font-semibold ${ isToday ? "text-[var(--app-text)]" : "text-[var(--app-muted)]" }`}
                        style={isToday ? { color: ACCENT } : undefined}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Rows */}
              <div className="relative">
                {scheduled.map((task) => {
                  const isDragging = drag?.taskId === task.id;
                  const preview = isDragging
                    ? previewGeometry(task, drag)
                    : geometryOf(task);
                  if (!preview) return null;

                  const startOffset = differenceInCalendarDays(preview.start, windowStart);
                  const clampedStart = Math.max(startOffset, 0);
                  const clampedEnd = Math.min(startOffset + preview.spanDays, windowDays);
                  const visibleSpan = clampedEnd - clampedStart;
                  if (visibleSpan <= 0) return null;

                  const left = clampedStart * DAY_WIDTH;
                  const width = Math.max(MIN_BAR_WIDTH, visibleSpan * DAY_WIDTH);
                  const color = barColor(task);
                  const timeLabel =
                    task.startTime || task.endTime
                      ? `${task.startTime ?? ""}${task.startTime && task.endTime ? " – " : ""}${
                          task.endTime ?? ""
                        }`
                      : null;

                  return (
                    <div
                      key={task.id}
                      className="group relative h-11 border-b border-[var(--app-border)]/70"
                    >
                      {/* day grid lines */}
                      <div className="absolute inset-0 flex divide-x divide-[var(--app-border)]">
                        {days.map((day) => (
                          <div key={toISO(day)} className="w-11 shrink-0" />
                        ))}
                      </div>

                      {/* bar */}
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label={`${task.title} — drag to move, use the edges to resize`}
                        onPointerDown={(event) => handlePointerDown(event, task)}
                        onPointerMove={(event) => handlePointerMove(event, task)}
                        onPointerUp={(event) => finishDrag(event, task)}
                        onPointerCancel={(event) => cancelDrag(event, task)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onSelectTask(task.id);
                          }
                        }}
                        className={`group absolute top-1.5 flex h-8 select-none items-center overflow-hidden rounded-lg border border-[var(--app-border)] shadow-xs transition-[filter,opacity] hover:brightness-110 ${ task.completed ? "opacity-50" : "" } ${isDragging ? "cursor-grabbing ring-2 ring-white/60" : "cursor-grab"}`}
                        style={{
                          left,
                          width,
                          backgroundColor: color,
                          touchAction: "none",
                        }}
                      >
                        {/* left edge handle */}
                        <span
                          data-drag-handle="start"
                          className="absolute inset-y-0 left-0 z-10 flex w-2 cursor-ew-resize items-center justify-center bg-[var(--app-panel)] opacity-0 transition-opacity group-hover:opacity-80 hover:bg-[var(--app-panel)]/40"
                          style={{ touchAction: "none" }}
                        >
                          <GripVertical className="h-3 w-3 text-white/90" />
                        </span>

                        {/* label */}
                        <span className="pointer-events-none flex min-w-0 flex-1 items-center gap-1 px-2 app-meta font-semibold text-white">
                          <span
                            className={`truncate ${ task.completed ? "line-through" : "" }`}
                          >
                            {task.title}
                          </span>
                          {timeLabel && (
                            <span className="hidden shrink-0 items-center gap-0.5 app-meta font-medium text-white/85 sm:flex">
                              <Clock className="h-2.5 w-2.5" />
                              {timeLabel}
                            </span>
                          )}
                        </span>

                        {/* right edge handle */}
                        <span
                          data-drag-handle="end"
                          className="absolute inset-y-0 right-0 z-10 flex w-2 cursor-ew-resize items-center justify-center bg-[var(--app-panel)] opacity-0 transition-opacity group-hover:opacity-80 hover:bg-[var(--app-panel)]/40"
                          style={{ touchAction: "none" }}
                        >
                          <GripVertical className="h-3 w-3 text-white/90" />
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* today marker */}
                {showTodayMarker && (
                  <div
                    className="pointer-events-none absolute inset-y-0 z-10 w-px"
                    style={{
                      left: (todayOffset + 0.5) * DAY_WIDTH,
                      backgroundColor: ACCENT,
                    }}
                  >
                    <span
                      className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                      style={{ backgroundColor: ACCENT }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--app-border)] px-4 py-2.5 app-meta text-[var(--app-muted)]">
        <span className="font-semibold text-[var(--app-text)]">Legend</span>
        {PRIORITY_LABELS.map(({ priority, label }) => (
          <span key={priority} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: PRIORITY_COLORS[priority] }}
            />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: "var(--app-accent, #4dabf7)" }}
          />
          Today
        </span>
        <span className="flex items-center gap-1.5">
          <GripVertical className="h-3 w-3" />
          Drag a bar to move it
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-1 rounded-sm bg-[var(--app-panel-alt)]" />
          Drag the edges to resize
        </span>
      </div>

      {/* Drag tooltip */}
      {drag && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-[var(--app-border)] bg-[var(--app-rail)] px-2.5 py-1.5 app-meta font-medium text-white shadow-lg"
          style={{ left: drag.clientX + 14, top: drag.clientY - 38 }}
        >
          {(() => {
            const task = scheduled.find((t) => t.id === drag.taskId);
            const preview = task ? previewGeometry(task, drag) : null;
            if (!preview) return null;
            return `${format(preview.start, "EEE d MMM")} – ${format(
              preview.end,
              "EEE d MMM"
            )} · ${formatDuration(preview.durationMinutes)}`;
          })()}
        </div>
      )}
    </div>
  );
}
