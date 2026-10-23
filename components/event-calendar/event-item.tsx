"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { differenceInMinutes, format, getMinutes, isPast } from "date-fns";
import { useMemo } from "react";

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
    <button
      className={cn(
        "flex size-full select-none overflow-hidden px-1.5 text-left font-medium outline-none transition focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50 data-dragging:cursor-grabbing data-dragging:shadow-lg sm:px-2",
        getEventColorClasses(event.color, isCompleted),
        getBorderRadiusClasses(isFirstDay, isLastDay),
        isCompleted && "line-through opacity-60",
        className,
      )}
      data-dragging={isDragging || undefined}
      data-completed={isCompleted || undefined}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      type="button"
      {...dndListeners}
      {...dndAttributes}
    >
      {children}
    </button>
  );
}

interface EventItemProps {
  event: CalendarEvent;
  view: "month" | "week" | "day" | "agenda";
  isDragging?: boolean;
  onClick?: (e: React.MouseEvent) => void;
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
          "mt-[var(--event-gap)] h-[var(--event-height)] items-center text-[11px] sm:text-xs",
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
          <div className="flex items-center gap-1.5 w-full truncate">
            {event.completed ? (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            ) : event.priority && event.priority > 0 ? (
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full shrink-0",
                  event.priority === 3
                    ? "bg-rose-500"
                    : event.priority === 2
                    ? "bg-amber-500"
                    : "bg-sky-500"
                )}
              />
            ) : null}
            {!event.allDay && (
              <span className="font-mono tt-meta opacity-75 shrink-0">
                {formatTimeWithOptionalMinutes(displayStart)}
              </span>
            )}
            <span className="truncate">{event.title}</span>
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
          view === "week" ? "text-[11px] sm:text-xs" : "text-xs",
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
          <div className="flex items-center gap-1.5 truncate">
            {event.completed ? (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            ) : event.priority && event.priority > 0 ? (
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full shrink-0",
                  event.priority === 3
                    ? "bg-rose-500"
                    : event.priority === 2
                    ? "bg-amber-500"
                    : "bg-sky-500"
                )}
              />
            ) : null}
            <span className="truncate">{event.title}</span>
            {showTime && (
              <span className="opacity-75 font-mono text-[10px]">
                {formatTimeWithOptionalMinutes(displayStart)}
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 truncate font-medium">
              {event.completed ? (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              ) : event.priority && event.priority > 0 ? (
                <span
                  className={cn(
                    "inline-block h-1.5 w-1.5 rounded-full shrink-0",
                    event.priority === 3
                      ? "bg-rose-500"
                      : event.priority === 2
                      ? "bg-amber-500"
                      : "bg-sky-500"
                  )}
                />
              ) : null}
              <span className="truncate">{event.title}</span>
            </div>
            {showTime && (
              <div className="truncate font-mono opacity-75 text-[10px]">
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
    <button
      className={cn(
        "flex w-full flex-col gap-1.5 rounded-xl border p-3 text-left outline-none transition focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50",
        getEventColorClasses(eventColor, isCompleted),
        isCompleted && "line-through opacity-60",
        className,
      )}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      type="button"
      {...dndListeners}
      {...dndAttributes}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium tt-heading truncate">
          {event.completed ? (
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          ) : event.priority && event.priority > 0 ? (
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full shrink-0",
                event.priority === 3
                  ? "bg-rose-500"
                  : event.priority === 2
                  ? "bg-amber-500"
                  : "bg-sky-500"
              )}
            />
          ) : null}
          <span className="truncate">{event.title}</span>
        </div>
        {event.listName && (
          <span className="tt-meta rounded-md bg-[var(--tt-panel-alt)] border border-[var(--tt-border)] px-2 py-0.5 text-[var(--tt-muted)] shrink-0 font-medium">
            {event.listName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 tt-meta text-[var(--tt-muted)]">
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
            <span className="text-[var(--tt-accent-text)] font-medium">
              {event.subtasksCompleted ?? 0}/{event.subtaskCount} subtasks
            </span>
          </>
        ) : null}
      </div>
      {event.description && (
        <div className="tt-body text-[var(--tt-muted)] line-clamp-2 mt-0.5">
          {event.description}
        </div>
      )}
    </button>
  );
}
