"use client";

import { RiCalendarCheckLine } from "@remixicon/react";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfWeek,
  format,
  isSameMonth,
  startOfWeek,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CalendarDays,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AgendaDaysToShow,
  AgendaView,
  addHoursToDate,
  CalendarDndProvider,
  type CalendarEvent,
  type CalendarView,
  DayView,
  EventDialog,
  EventGap,
  EventHeight,
  MonthView,
  WeekCellsHeight,
  WeekView,
  YearView,
} from "@/components/event-calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface EventCalendarProps {
  events?: CalendarEvent[];
  onEventAdd?: (event: CalendarEvent) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
  onEventToggleComplete?: (eventId: string, completed: boolean) => void;
  onOpenTaskDetails?: (taskId: string) => void;
  lists?: Array<{ id: string; name: string; color?: string }>;
  className?: string;
  initialView?: CalendarView;
}

export function EventCalendar({
  events = [],
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  onEventToggleComplete,
  onOpenTaskDetails,
  lists = [],
  className,
  initialView = "month",
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>(initialView);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Keyboard shortcuts for view switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        isEventDialogOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "m":
          setView("month");
          break;
        case "w":
          setView("week");
          break;
        case "d":
          setView("day");
          break;
        case "a":
          setView("agenda");
          break;
        case "y":
          setView("year");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEventDialogOpen]);

  const handlePrevious = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (view === "day") {
      setCurrentDate(addDays(currentDate, -1));
    } else if (view === "agenda") {
      setCurrentDate(addDays(currentDate, -AgendaDaysToShow));
    } else if (view === "year") {
      setCurrentDate(subYears(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (view === "day") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (view === "agenda") {
      setCurrentDate(addDays(currentDate, AgendaDaysToShow));
    } else if (view === "year") {
      setCurrentDate(addYears(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventSelect = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleEventCreate = (startTime: Date) => {
    const minutes = startTime.getMinutes();
    const remainder = minutes % 15;
    if (remainder !== 0) {
      if (remainder < 7.5) {
        startTime.setMinutes(minutes - remainder);
      } else {
        startTime.setMinutes(minutes + (15 - remainder));
      }
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);
    }

    const newEvent: CalendarEvent = {
      allDay: false,
      end: addHoursToDate(startTime, 1),
      id: "",
      start: startTime,
      title: "",
      color: "sky",
    };
    setSelectedEvent(newEvent);
    setIsEventDialogOpen(true);
  };

  const handleEventSave = (event: CalendarEvent) => {
    if (event.id) {
      onEventUpdate?.(event);
      toast(`Task "${event.title}" updated`, {
        description: format(new Date(event.start), "MMM d, yyyy"),
        position: "bottom-left",
      });
    } else {
      const newId = Math.random().toString(36).substring(2, 11);
      onEventAdd?.({
        ...event,
        id: newId,
      });
      toast(`Task "${event.title}" created`, {
        description: format(new Date(event.start), "MMM d, yyyy"),
        position: "bottom-left",
      });
    }
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleEventDelete = (eventId: string) => {
    const deletedEvent = events.find((e) => e.id === eventId);
    onEventDelete?.(eventId);
    setIsEventDialogOpen(false);
    setSelectedEvent(null);

    if (deletedEvent) {
      toast(`Task "${deletedEvent.title}" deleted`, {
        position: "bottom-left",
      });
    }
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    onEventUpdate?.(updatedEvent);
    toast(`Task "${updatedEvent.title}" moved`, {
      description: format(new Date(updatedEvent.start), "MMM d, yyyy"),
      position: "bottom-left",
    });
  };

  const viewTitle = useMemo(() => {
    if (view === "year") {
      return format(currentDate, "yyyy");
    }
    if (view === "month") {
      return format(currentDate, "MMMM yyyy");
    }
    if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      if (isSameMonth(start, end)) {
        return format(start, "MMMM yyyy");
      }
      return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    if (view === "day") {
      return (
        <>
          <span aria-hidden="true" className="min-[480px]:hidden">
            {format(currentDate, "MMM d, yyyy")}
          </span>
          <span aria-hidden="true" className="max-[479px]:hidden min-md:hidden">
            {format(currentDate, "MMMM d, yyyy")}
          </span>
          <span className="max-md:hidden">
            {format(currentDate, "EEEE, MMMM d, yyyy")}
          </span>
        </>
      );
    }
    if (view === "agenda") {
      const start = currentDate;
      const end = addDays(currentDate, AgendaDaysToShow - 1);
      if (isSameMonth(start, end)) {
        return format(start, "MMMM yyyy");
      }
      return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    return format(currentDate, "MMMM yyyy");
  }, [currentDate, view]);

  return (
    <div
      className={cn(
        "flex flex-1 min-h-0 flex-col rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel)] overflow-hidden transition-colors shadow-sm",
        className
      )}
      style={
        {
          "--event-gap": `${EventGap}px`,
          "--event-height": `${EventHeight}px`,
          "--week-cells-height": `${WeekCellsHeight}px`,
        } as React.CSSProperties
      }
    >
      <CalendarDndProvider onEventUpdate={handleEventUpdate}>
        {/* Navigation Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 border-b border-[var(--tt-border)] bg-[var(--tt-panel)]">
          {/* Left Controls: Today, Prev/Next, Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={handleToday}
              variant="outline"
              size="sm"
              className="border-[var(--tt-border)] bg-[var(--tt-panel-alt)] text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)]/80 tt-label font-medium"
            >
              <RiCalendarCheckLine
                aria-hidden="true"
                className="sm:hidden"
                size={16}
              />
              <span className="hidden sm:inline">Today</span>
            </Button>

            <div className="flex items-center rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] p-0.5">
              <button
                type="button"
                aria-label="Previous period"
                onClick={handlePrevious}
                className="p-1.5 text-[var(--tt-text)] hover:text-white rounded-md transition-colors cursor-pointer"
              >
                <ChevronLeftIcon aria-hidden="true" size={16} />
              </button>
              <button
                type="button"
                aria-label="Next period"
                onClick={handleNext}
                className="p-1.5 text-[var(--tt-text)] hover:text-white rounded-md transition-colors cursor-pointer"
              >
                <ChevronRightIcon aria-hidden="true" size={16} />
              </button>
            </div>

            <h2 className="tt-heading font-semibold text-[var(--tt-text)] ml-1 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[var(--tt-accent-text)] hidden sm:inline-block" />
              <span>{viewTitle}</span>
            </h2>
          </div>

          {/* Right Controls: View Switcher & New Task */}
          <div className="flex items-center gap-2">
            {/* Desktop Segmented View Switcher */}
            <div className="hidden md:flex items-center rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] p-0.5">
              {(
                [
                  { id: "month", label: "Month", shortcut: "M" },
                  { id: "week", label: "Week", shortcut: "W" },
                  { id: "day", label: "Day", shortcut: "D" },
                  { id: "agenda", label: "Agenda", shortcut: "A" },
                  { id: "year", label: "Year", shortcut: "Y" },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  title={`${v.label} (${v.shortcut})`}
                  className={cn(
                    "rounded-md px-2.5 py-1 tt-label font-medium transition-colors cursor-pointer",
                    view === v.id
                      ? "bg-[var(--tt-panel)] text-[var(--tt-accent-text)] shadow-xs font-semibold border border-[var(--tt-border)]/60"
                      : "text-[var(--tt-muted)] hover:text-[var(--tt-text)]"
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Mobile Dropdown View Switcher */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="gap-1.5 border-[var(--tt-border)] bg-[var(--tt-panel-alt)] text-[var(--tt-text)]"
                    variant="outline"
                    size="sm"
                  >
                    <span>{view.charAt(0).toUpperCase() + view.slice(1)}</span>
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="opacity-60"
                      size={14}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-32 bg-[var(--tt-panel)] border-[var(--tt-border)] text-[var(--tt-text)]"
                >
                  <DropdownMenuItem onClick={() => setView("month")}>
                    Month <DropdownMenuShortcut>M</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView("week")}>
                    Week <DropdownMenuShortcut>W</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView("day")}>
                    Day <DropdownMenuShortcut>D</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView("agenda")}>
                    Agenda <DropdownMenuShortcut>A</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView("year")}>
                    Year <DropdownMenuShortcut>Y</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* New Task Button */}
            <Button
              onClick={() => {
                setSelectedEvent(null);
                setIsEventDialogOpen(true);
              }}
              size="sm"
              className="bg-[var(--tt-accent-strong)] text-white hover:bg-[var(--tt-accent-strong)]/90 gap-1.5 rounded-lg shadow-sm"
            >
              <PlusIcon aria-hidden="true" size={16} />
              <span className="hidden sm:inline">New task</span>
            </Button>
          </div>
        </div>

        {/* Calendar View Area */}
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          {view === "month" && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onEventCreate={handleEventCreate}
              onEventSelect={handleEventSelect}
            />
          )}
          {view === "week" && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onEventCreate={handleEventCreate}
              onEventSelect={handleEventSelect}
            />
          )}
          {view === "day" && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEventCreate={handleEventCreate}
              onEventSelect={handleEventSelect}
            />
          )}
          {view === "agenda" && (
            <AgendaView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
            />
          )}
          {view === "year" && (
            <YearView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
              onSelectDate={(date) => {
                setCurrentDate(date);
                setView("day");
              }}
            />
          )}
        </div>

        <EventDialog
          event={selectedEvent}
          isOpen={isEventDialogOpen}
          lists={lists}
          onClose={() => {
            setIsEventDialogOpen(false);
            setSelectedEvent(null);
          }}
          onDelete={handleEventDelete}
          onOpenTaskDetails={onOpenTaskDetails}
          onSave={handleEventSave}
        />
      </CalendarDndProvider>
    </div>
  );
}
