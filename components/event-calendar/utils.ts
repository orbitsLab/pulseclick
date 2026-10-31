import { isSameDay } from "date-fns";

import type {
  CalendarEvent,
  EventColor,
} from "@/components/event-calendar";

/**
 * Get CSS classes for event colors
 */
export function getEventColorClasses(color?: EventColor | string, completed?: boolean): string {
  if (completed) {
    return "bg-[var(--app-hover)] text-[var(--app-muted)] border border-[var(--app-border)] line-through opacity-60";
  }

  const eventColor = color || "slate";

  switch (eventColor) {
    case "rose":
      return "bg-[rgba(255,0,26,0.08)] hover:bg-[rgba(255,0,26,0.14)] text-[#eb5757] dark:text-[#ff7369] border border-[rgba(255,0,26,0.2)]";
    case "amber":
      return "bg-[rgba(203,145,47,0.1)] hover:bg-[rgba(203,145,47,0.16)] text-[#dfab01] dark:text-[#f3cd46] border border-[rgba(203,145,47,0.25)]";
    case "sky":
      return "bg-[rgba(35,131,226,0.1)] hover:bg-[rgba(35,131,226,0.16)] text-[#2383e2] dark:text-[#529cca] border border-[rgba(35,131,226,0.25)]";
    case "emerald":
      return "bg-[rgba(68,131,97,0.1)] hover:bg-[rgba(68,131,97,0.16)] text-[#448361] dark:text-[#4dab9a] border border-[rgba(68,131,97,0.25)]";
    case "violet":
      return "bg-[rgba(144,101,176,0.1)] hover:bg-[rgba(144,101,176,0.16)] text-[#9065b0] dark:text-[#9a6dd7] border border-[rgba(144,101,176,0.25)]";
    case "orange":
      return "bg-[rgba(217,115,13,0.1)] hover:bg-[rgba(217,115,13,0.16)] text-[#d9730d] dark:text-[#ff9231] border border-[rgba(217,115,13,0.25)]";
    case "slate":
    default:
      return "bg-[var(--app-hover)] hover:bg-[var(--app-active)] text-[var(--app-text)] border border-[var(--app-border)]";
  }
}

/**
 * Get CSS classes for border radius based on event position in multi-day events
 */
export function getBorderRadiusClasses(
  isFirstDay: boolean,
  isLastDay: boolean,
): string {
  if (isFirstDay && isLastDay) {
    return "rounded-[3px]"; // Both ends rounded
  }
  if (isFirstDay) {
    return "rounded-l-[3px] rounded-r-none"; // Only left end rounded
  }
  if (isLastDay) {
    return "rounded-r-[3px] rounded-l-none"; // Only right end rounded
  }
  return "rounded-none"; // No rounded corners
}

/**
 * Check if an event is a multi-day event
 */
export function isMultiDayEvent(event: CalendarEvent): boolean {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  return event.allDay || eventStart.getDate() !== eventEnd.getDate();
}

/**
 * Filter events for a specific day
 */
export function getEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      return isSameDay(day, eventStart);
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Sort events with multi-day events first, then by start time
 */
export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const aIsMultiDay = isMultiDayEvent(a);
    const bIsMultiDay = isMultiDayEvent(b);

    if (aIsMultiDay && !bIsMultiDay) return -1;
    if (!aIsMultiDay && bIsMultiDay) return 1;

    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });
}

/**
 * Get multi-day events that span across a specific day (but don't start on that day)
 */
export function getSpanningEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((event) => {
    if (!isMultiDayEvent(event)) return false;

    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Only include if it's not the start day but is either the end day or a middle day
    return (
      !isSameDay(day, eventStart) &&
      (isSameDay(day, eventEnd) || (day > eventStart && day < eventEnd))
    );
  });
}

/**
 * Get all events visible on a specific day (starting, ending, or spanning)
 */
export function getAllEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return (
      isSameDay(day, eventStart) ||
      isSameDay(day, eventEnd) ||
      (day > eventStart && day < eventEnd)
    );
  });
}

/**
 * Get all events for a day (for agenda view)
 */
export function getAgendaEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        isSameDay(day, eventStart) ||
        isSameDay(day, eventEnd) ||
        (day > eventStart && day < eventEnd)
      );
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Add hours to a date
 */
export function addHoursToDate(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}
