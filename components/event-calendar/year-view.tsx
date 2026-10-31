"use client";

import {
  format,
  isSameDay,
  isToday,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import React, { useMemo } from "react";
import { type CalendarEvent } from "@/components/event-calendar";
import { cn } from "@/lib/utils";

interface YearViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect?: (event: CalendarEvent) => void;
  onSelectDate?: (date: Date) => void;
}

export function YearView({
  currentDate,
  events,
  onEventSelect,
  onSelectDate,
}: YearViewProps) {
  const year = currentDate.getFullYear();
  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

  // Group events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const start = new Date(ev.start);
      const iso = format(start, "yyyy-MM-dd");
      const list = map.get(iso) || [];
      list.push(ev);
      map.set(iso, list);
    }
    return map;
  }, [events]);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5" data-slot="year-view">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, monthIndex) => {
          const mFirst = new Date(year, monthIndex, 1);
          const mLast = new Date(year, monthIndex + 1, 0);
          // Monday offset
          const offset = (mFirst.getDay() + 6) % 7;
          const totalDays = mLast.getDate();

          // Count tasks in month
          let monthCount = 0;
          for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            monthCount += (eventsByDate.get(dateStr) || []).length;
          }

          return (
            <div
              key={monthIndex}
              className="flex flex-col rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] p-3 hover:border-[var(--app-border-strong)] transition-colors"
            >
              {/* Month Header */}
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--app-text)]">
                  {format(mFirst, "MMMM")}
                </span>
                {monthCount > 0 && (
                  <span className="rounded-[3px] bg-[var(--app-panel-hover)] px-1.5 py-0.5 text-[11px] font-mono font-medium text-[var(--app-muted)]">
                    {monthCount} {monthCount === 1 ? "task" : "tasks"}
                  </span>
                )}
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 text-center app-meta text-[var(--app-muted)] pb-1 border-b border-[var(--app-border)]/50">
                {weekDays.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>

              {/* Days grid */}
              <div className="mt-1.5 grid grid-cols-7 gap-1">
                {Array.from({ length: offset }).map((_, i) => (
                  <span key={`empty-${i}`} />
                ))}

                {Array.from({ length: totalDays }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dayDate = new Date(year, monthIndex, dayNum);
                  const iso = format(dayDate, "yyyy-MM-dd");
                  const dayEvents = eventsByDate.get(iso) || [];
                  const count = dayEvents.length;
                  const isCurrentDay = isToday(dayDate);

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => onSelectDate?.(dayDate)}
                      title={`${iso}: ${count} task${count === 1 ? "" : "s"}`}
                      className={cn(
                        "flex h-6 w-full items-center justify-center rounded-md app-meta font-medium transition-all cursor-pointer",
                        isCurrentDay
                          ? "bg-[var(--app-accent-strong)] text-white font-bold"
                          : count > 0
                          ? "bg-[var(--app-accent)]/15 text-[var(--app-accent-text)] font-semibold hover:bg-[var(--app-accent)]/25"
                          : "text-[var(--app-muted)] hover:bg-[var(--app-panel)] hover:text-[var(--app-text)]"
                      )}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
