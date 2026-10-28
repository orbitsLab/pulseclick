"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { differenceInCalendarDays, differenceInMinutes, format, getMinutes } from "date-fns";
import { Check, X } from "lucide-react";
import React, { useMemo } from "react";

import {
  type CalendarEvent,
  getBorderRadiusClasses,
  getEventColorClasses,
} from "@/components/event-calendar";
import { cn } from "@/lib/utils";

// Using date-fns format with custom formatting:
// 'h' - hours (1-12)
// 'a' - am/pm
// ':mm' - minutes with leading zero (only if the token 'mm' is present)
const formatTimeWithOptionalMinutes = (date: Date) => {
  return format(date, getMinutes(date) === 0 ? "ha" : "h:mma").toLowerCase();
};

interface EventCheckboxProps {
  completed?: boolean;
  kanbanStatus?: string;
  priority?: number;
  title: string;
  onToggle?: (e: React.MouseEvent) => void;
  size?: "sm" | "md";
}

function EventCheckbox({ completed, kanbanStatus, priority, title, onToggle, size = "sm" }: EventCheckboxProps) {
  const isCompleted = Boolean(completed);
  const isWontDo = isCompleted && kanbanStatus === "WONT_DO";
  const sizeClasses = size === "sm" ? "h-3.5 w-3.5 rounded-[4px]" : "h-4 w-4 rounded-md";
  const iconSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isCompleted}
      aria-label={`Mark "${title}" as ${isCompleted ? "incomplete" : "complete"}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.(e);
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className={cn(
        "flex shrink-0 items-center justify-center border transition-all active:scale-90 cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-[var(--app-accent)]",
        sizeClasses,
        isCompleted
          ? isWontDo
            ? "border-rose-500 bg-rose-500 text-white shadow-xs"
            : "border-emerald-500 bg-emerald-500 text-white shadow-xs"
          : priority === 3
          ? "border-rose-500 bg-rose-500/15 hover:bg-rose-500/30 text-rose-500"
          : priority === 2
          ? "border-amber-500 bg-amber-500/15 hover:bg-amber-500/30 text-amber-500"
          : priority === 1
          ? "border-sky-500 bg-sky-500/15 hover:bg-sky-500/30 text-sky-500"
          : "border-[var(--app-border)] bg-[var(--app-panel)]/80 hover:border-[var(--app-accent)] text-[var(--app-muted)]"
      )}
    >
      {isCompleted && (
        isWontDo ? (
          <X className={cn(iconSize, "stroke-[3]")} />
        ) : (
          <Check className={cn(iconSize, "stroke-[3]")} />
        )
      )}
    </button>
  );
}

interface EventWrapperProps {
  event: CalendarEvent;
  isFirstDay?: boolean;
  isLastDay?: boolean;
  isDragging?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  children: React.ReactNode;
  currentTime?: Date;
  dndListeners?: SyntheticListenerMap;
  dndAttributes?: DraggableAttributes;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}

// Shared wrapper component for event styling
function EventWrapper({
  event,
  isFirstDay = true,
  isLastDay = true,
  isDragging,
  onClick,
  className,
  children,
  currentTime,
  dndListeners,
  dndAttributes,
  onMouseDown,
  onTouchStart,
}: EventWrapperProps) {
  const isCompleted = Boolean(event.completed);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex size-full select-none overflow-hidden px-1.5 text-left font-medium outline-none transition focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50 data-dragging:cursor-grabbing data-dragging:shadow-lg sm:px-2 cursor-pointer",
        getEventColorClasses(event.color, isCompleted),
        getBorderRadiusClasses(isFirstDay, isLastDay),
        isCompleted && "line-through opacity-60",
        className,
      )}
      data-dragging={isDragging || undefined}
      data-completed={isCompleted || undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(e as any);
        }
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      {...dndListeners}
      {...dndAttributes}
    >
      {children}
    </div>
  );
}

interface EventItemProps {
  event: CalendarEvent;
  view: "month" | "week" | "day" | "agenda";
  isDragging?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onToggleComplete?: (eventId: string, completed: boolean) => void;
  showTime?: boolean;
  currentTime?: Date; // For updating time during drag
  isFirstDay?: boolean;
  isLastDay?: boolean;
  children?: React.ReactNode;
  className?: string;
  dndListeners?: SyntheticListenerMap;
  dndAttributes?: DraggableAttributes;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}

export function EventItem({
  event,
  view,
  isDragging,
  onClick,
  onToggleComplete,
  showTime,
  currentTime,
  isFirstDay = true,
  isLastDay = true,
  children,
  className,
  dndListeners,
  dndAttributes,
  onMouseDown,
  onTouchStart,
}: EventItemProps) {
  const eventColor = event.color;

  // Use the provided currentTime (for dragging) or the event's actual time
  const displayStart = useMemo(() => {
    return currentTime || new Date(event.start);
  }, [currentTime, event.start]);

  const displayEnd = useMemo(() => {
    return currentTime
      ? new Date(
          new Date(currentTime).getTime() +
            (new Date(event.end).getTime() - new Date(event.start).getTime()),
        )
      : new Date(event.end);
  }, [currentTime, event.start, event.end]);

  // Calculate event duration in minutes
  const durationMinutes = useMemo(() => {
    return differenceInMinutes(displayEnd, displayStart);
  }, [displayStart, displayEnd]);

  const getEventTime = () => {
    if (event.allDay) return "All day";

    // For short events (less than 45 minutes), only show start time
    if (durationMinutes < 45) {
      return formatTimeWithOptionalMinutes(displayStart);
    }

    // For longer events, show both start and end time
    return `${formatTimeWithOptionalMinutes(displayStart)} - ${formatTimeWithOptionalMinutes(displayEnd)}`;
  };

  if (view === "month") {
    return (
      <EventWrapper
        className={cn(
          "mt-[var(--event-gap)] h-[var(--event-height)] items-center app-meta sm:app-label",
          className,
        )}
        currentTime={currentTime}
        dndAttributes={dndAttributes}
        dndListeners={dndListeners}
        event={event}
        isDragging={isDragging}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        onClick={onClick}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {children || (
          <div className="flex items-center gap-1.5 w-full min-w-0">
            <EventCheckbox
              completed={event.completed}
              kanbanStatus={event.kanbanStatus}
              priority={event.priority}
              title={event.title}
              size="sm"
              onToggle={() => onToggleComplete?.(event.id, !event.completed)}
            />
            {!event.allDay && (
              <span className="font-mono app-meta opacity-75 shrink-0">
                {formatTimeWithOptionalMinutes(displayStart)}
              </span>
            )}
            <span className={cn("truncate min-w-0 font-medium", event.completed && "line-through text-[var(--app-muted)]")}>
              {event.title}
            </span>
            {isFirstDay && !isLastDay && (
              <span className="ml-auto text-[10px] font-mono text-[var(--app-muted)] shrink-0 select-none">
                {Math.max(1, differenceInCalendarDays(displayEnd, displayStart) + 1)}d
              </span>
            )}
          </div>
        )}
      </EventWrapper>
    );
  }

  if (view === "week" || view === "day") {
    return (
      <EventWrapper
        className={cn(
          "py-1",
          durationMinutes < 45 ? "items-center" : "flex-col",
          view === "week" ? "app-meta sm:app-label" : "app-label",
          className,
        )}
        currentTime={currentTime}
        dndAttributes={dndAttributes}
        dndListeners={dndListeners}
        event={event}
        isDragging={isDragging}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        onClick={onClick}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {durationMinutes < 45 ? (
          <div className="flex items-center gap-1.5 w-full min-w-0">
            <EventCheckbox
              completed={event.completed}
              kanbanStatus={event.kanbanStatus}
              priority={event.priority}
              title={event.title}
              size="sm"
              onToggle={() => onToggleComplete?.(event.id, !event.completed)}
            />
            <span className={cn("truncate min-w-0 font-medium", event.completed && "line-through text-[var(--app-muted)]")}>
              {event.title}
            </span>
            {isFirstDay && !isLastDay && (
              <span className="ml-auto text-[10px] font-mono text-[var(--app-muted)] shrink-0 select-none">
                {Math.max(1, differenceInCalendarDays(displayEnd, displayStart) + 1)}d
              </span>
            )}
            {showTime && (
              <span className="opacity-75 font-mono app-meta shrink-0 ml-auto">
                {formatTimeWithOptionalMinutes(displayStart)}
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 w-full min-w-0 font-medium">
              <EventCheckbox
                completed={event.completed}
                kanbanStatus={event.kanbanStatus}
                priority={event.priority}
                title={event.title}
                size="sm"
                onToggle={() => onToggleComplete?.(event.id, !event.completed)}
              />
              <span className={cn("truncate min-w-0 font-medium", event.completed && "line-through text-[var(--app-muted)]")}>
                {event.title}
              </span>
            </div>
            {showTime && (
              <div className="truncate font-mono opacity-75 app-meta pl-5">
                {getEventTime()}
              </div>
            )}
          </>
        )}
      </EventWrapper>
    );
  }

  // Agenda view
  const isCompleted = Boolean(event.completed);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex w-full flex-col gap-1.5 rounded-xl border p-3 text-left outline-none transition focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50 cursor-pointer",
        getEventColorClasses(eventColor, isCompleted),
        isCompleted && "line-through opacity-60",
        className,
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(e as any);
        }
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      {...dndListeners}
      {...dndAttributes}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 font-medium app-heading truncate min-w-0">
          <EventCheckbox
            completed={event.completed}
            kanbanStatus={event.kanbanStatus}
            priority={event.priority}
            title={event.title}
            size="md"
            onToggle={() => onToggleComplete?.(event.id, !event.completed)}
          />
          <span className={cn("truncate", isCompleted && "line-through text-[var(--app-muted)]")}>
            {event.title}
          </span>
        </div>
        {event.listName && (
          <span className="app-meta rounded-md bg-[var(--app-panel-alt)] border border-[var(--app-border)] px-2 py-0.5 text-[var(--app-muted)] shrink-0 font-medium">
            {event.listName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 app-meta text-[var(--app-muted)] pl-6.5">
        {event.allDay ? (
          <span>All day</span>
        ) : (
          <span className="font-mono">
            {formatTimeWithOptionalMinutes(displayStart)} – {formatTimeWithOptionalMinutes(displayEnd)}
          </span>
        )}
        {event.location && (
          <>
            <span className="opacity-40">·</span>
            <span>{event.location}</span>
          </>
        )}
        {event.subtaskCount ? (
          <>
            <span className="opacity-40">·</span>
            <span className="text-[var(--app-accent-text)] font-medium">
              {event.subtasksCompleted ?? 0}/{event.subtaskCount} subtasks
            </span>
          </>
        ) : null}
      </div>
      {event.description && (
        <div className="app-body text-[var(--app-muted)] line-clamp-2 mt-0.5 pl-6.5">
          {event.description}
        </div>
      )}
    </div>
  );
}
