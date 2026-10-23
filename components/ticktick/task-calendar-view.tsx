"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalIcon,
  Plus,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Task } from "@/hooks/use-ticktick";
import {
  getTodayISO,
  parseISODate,
  toISODate,
  addDays,
  getMondayOfWeek,
  getWeekDays,
  formatWeekRange,
  formatShortDate,
} from "@/lib/date-utils";

interface TaskCalendarViewProps {
  tasks: Task[];
  onSelectTask: (taskId: string) => void;
  onAddTaskForDate: (dateIso: string) => void;
}

export function TaskCalendarView({ tasks, onSelectTask, onAddTaskForDate }: TaskCalendarViewProps) {
  const today = getTodayISO();
  const [viewMode, setViewMode] = useState<"month" | "week" | "agenda" | "year">("month");

  // Month navigation state
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Week navigation state
  const [weekMonday, setWeekMonday] = useState<string>(() => getMondayOfWeek(getTodayISO()));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month & number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();

  // Day of week offset (Monday = 0)
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;

  function prevPeriod() {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === "year") {
      setCurrentDate(new Date(year - 1, month, 1));
    } else {
      setWeekMonday((prev) => addDays(prev, -7));
    }
  }

  function nextPeriod() {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === "year") {
      setCurrentDate(new Date(year + 1, month, 1));
    } else {
      setWeekMonday((prev) => addDays(prev, 7));
    }
  }

  function jumpToday() {
    setCurrentDate(new Date());
    setWeekMonday(getMondayOfWeek(today));
  }

  const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const weekLabel = formatWeekRange(weekMonday);
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const currentWeekDays = getWeekDays(weekMonday);

  // Priority color
  function getTaskPriorityColor(priority: number) {
    switch (priority) {
      case 3:
        return "bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30";
      case 2:
        return "bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30";
      case 1:
        return "bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30";
      default:
        return "bg-[var(--tt-panel-alt)] text-[var(--tt-text)] border-[var(--tt-border)] hover:bg-[var(--tt-panel-alt)] dark:bg-[var(--tt-panel-alt)] dark:text-[var(--tt-muted)] dark:border-[var(--tt-border)] dark:hover:bg-[var(--tt-panel-alt)]";
    }
  }

  return (
    <div className="flex-1 flex flex-col rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel)] p-4 shadow-sm transition-colors sm:p-5 overflow-hidden">
      {/* Calendar Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-[var(--tt-border)] pb-3">
        <div className="flex items-center gap-3">
          <CalIcon className="h-5 w-5 text-[var(--tt-accent-text)]" />
          <h2 className="tt-heading font-semibold text-[var(--tt-text)]">
            {viewMode === "month" || viewMode === "agenda"
              ? monthLabel
              : viewMode === "year"
              ? String(year)
              : weekLabel}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Month / Week Switcher */}
          <div className="flex items-center rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`rounded-md px-2.5 py-1 tt-label font-medium transition-colors ${ viewMode === "month" ? "bg-[var(--tt-panel)] text-[var(--tt-accent-text)] shadow-xs dark:bg-[var(--tt-panel-alt)] font-bold" : "text-[var(--tt-muted)] hover:text-[var(--tt-text)] dark:text-[var(--tt-muted)]" }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`rounded-md px-2.5 py-1 tt-label font-medium transition-colors ${ viewMode === "week" ? "bg-[var(--tt-panel)] text-[var(--tt-accent-text)] shadow-xs dark:bg-[var(--tt-panel-alt)] font-bold" : "text-[var(--tt-muted)] hover:text-[var(--tt-text)] dark:text-[var(--tt-muted)]" }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode("agenda")}
              className={`rounded-md px-2.5 py-1 tt-label font-medium transition-colors ${ viewMode === "agenda" ? "bg-[var(--tt-panel)] text-[var(--tt-accent-text)] shadow-xs dark:bg-[var(--tt-panel-alt)] font-bold" : "text-[var(--tt-muted)] hover:text-[var(--tt-text)] dark:text-[var(--tt-muted)]" }`}
            >
              Agenda
            </button>
            <button
              type="button"
              onClick={() => setViewMode("year")}
              className={`rounded-md px-2.5 py-1 tt-label font-medium transition-colors ${ viewMode === "year" ? "bg-[var(--tt-panel)] text-[var(--tt-accent-text)] shadow-xs dark:bg-[var(--tt-panel-alt)] font-bold" : "text-[var(--tt-muted)] hover:text-[var(--tt-text)] dark:text-[var(--tt-muted)]" }`}
            >
              Year
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={jumpToday}
              className="rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-3 py-1 tt-label font-medium text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)]"
            >
              Today
            </button>
            <div className="flex items-center rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)]">
              <button
                type="button"
                onClick={prevPeriod}
                className="p-1 text-[var(--tt-text)] hover:text-[var(--tt-text)] dark:hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={nextPeriod}
                className="p-1 text-[var(--tt-text)] hover:text-[var(--tt-text)] dark:hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === "month" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center tt-label font-semibold text-[var(--tt-muted)] uppercase py-1 border-b border-[var(--tt-border)]/80">
            {weekDays.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="flex-1 grid grid-cols-7 gap-1 mt-1 auto-rows-fr overflow-y-auto">
            {/* Empty placeholder cells for offset */}
            {Array.from({ length: startDayOfWeek }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="rounded-xl border border-transparent bg-[var(--tt-panel-alt)]/20 min-h-[90px]"
              />
            ))}

            {/* Days of month */}
            {Array.from({ length: totalDays }).map((_, idx) => {
              const dayNum = idx + 1;
              const cellDate = new Date(year, month, dayNum);
              const cellDateIso = toISODate(cellDate);
              const isToday = cellDateIso === today;

              // Tasks due on this date
              const dayTasks = tasks.filter((t) => t.dueDate === cellDateIso);

              return (
                <div
                  key={dayNum}
                  className={`group flex flex-col rounded-xl border p-1.5 min-h-[95px] transition-colors ${ isToday ? "border-[var(--tt-accent)]/50 bg-[var(--tt-accent)]/5 bg-[var(--tt-accent)]/10" : "border-[var(--tt-border)] bg-[var(--tt-panel-alt)]/50 hover:bg-[var(--tt-panel-alt)]/50 dark:border-[var(--tt-border)] dark:bg-[var(--tt-bg)]/60 dark:hover:bg-[var(--tt-panel-alt)]/40" }`}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full tt-meta font-bold ${ isToday ? "bg-[var(--tt-accent-strong)] text-white" : "text-[var(--tt-text)]" }`}
                    >
                      {dayNum}
                    </span>

                    <button
                      type="button"
                      onClick={() => onAddTaskForDate(cellDateIso)}
                      title="Add task on this date"
                      className="rounded p-0.5 text-[var(--tt-muted)] opacity-0 group-hover:opacity-100 hover:bg-[var(--tt-panel-alt)] hover:text-white"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Task pills */}
                  <div className="space-y-1 overflow-y-auto max-h-20 flex-1">
                    {dayTasks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onSelectTask(t.id)}
                        className={`flex w-full items-center gap-1 rounded border px-1.5 py-0.5 text-left tt-meta font-medium truncate transition-all ${getTaskPriorityColor( t.priority )} ${t.completed ? "line-through opacity-50" : ""}`}
                      >
                        {t.dueTime && (
                          <span className="font-mono tt-meta opacity-80 flex-shrink-0">
                            {t.dueTime}
                          </span>
                        )}
                        <span className="truncate">{t.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === "week" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-7 gap-2 flex-1 overflow-y-auto">
            {currentWeekDays.map((day) => {
              const isToday = day.iso === today;
              const dayTasks = tasks.filter((t) => t.dueDate === day.iso);

              return (
                <div
                  key={day.iso}
                  className={`group flex flex-col rounded-xl border p-2 transition-colors min-h-[300px] ${ isToday ? "border-[var(--tt-accent)]/50 bg-[var(--tt-accent)]/5 bg-[var(--tt-accent)]/10" : "border-[var(--tt-border)] bg-[var(--tt-panel-alt)]/50 hover:bg-[var(--tt-panel-alt)]/50 dark:border-[var(--tt-border)] dark:bg-[var(--tt-bg)]/60 dark:hover:bg-[var(--tt-panel-alt)]/40" }`}
                >
                  {/* Day Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--tt-border)]/80">
                    <div className="flex items-center gap-1.5">
                      <span className="tt-overline font-semibold text-[var(--tt-muted)]">
                        {day.shortName}
                      </span>
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full tt-label font-semibold ${ isToday ? "bg-[var(--tt-accent-strong)] text-white" : "text-[var(--tt-text)]" }`}
                      >
                        {day.dayNum}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddTaskForDate(day.iso)}
                      title={`Add task for ${day.shortName}`}
                      className="rounded p-1 text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)] hover:text-white transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Tasks List for Day */}
                  <div className="flex-1 space-y-1.5 overflow-y-auto pr-0.5">
                    {dayTasks.length === 0 ? (
                      <div className="flex h-24 items-center justify-center tt-meta text-[var(--tt-muted)]">
                        No tasks
                      </div>
                    ) : (
                      dayTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => onSelectTask(t.id)}
                          className={`flex flex-col gap-1 rounded-lg border p-2 cursor-pointer transition-all ${getTaskPriorityColor( t.priority )} ${t.completed ? "line-through opacity-50" : ""}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="tt-label font-medium truncate">{t.title}</span>
                          </div>

                          {t.dueTime && (
                            <div className="flex items-center gap-1 tt-meta opacity-80">
                              <Clock className="h-2.5 w-2.5" />
                              <span>{t.dueTime}</span>
                            </div>
                          )}

                          {t.subtasks && t.subtasks.length > 0 && (
                            <div className="flex items-center gap-1 tt-meta text-[var(--tt-accent-text)] font-semibold">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              <span>
                                {t.subtasks.filter((s) => s.completed).length}/{t.subtasks.length}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* AGENDA VIEW */}
      {viewMode === "agenda" && (
        <div className="flex-1 overflow-y-auto pr-1">
          {(() => {
            const scheduled = tasks
              .filter((t) => t.dueDate)
              .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1));

            const groups = new Map<string, Task[]>();
            for (const task of scheduled) {
              const key = task.dueDate!;
              groups.set(key, [...(groups.get(key) ?? []), task]);
            }

            if (!groups.size) {
              return (
                <div className="flex h-full items-center justify-center tt-body text-[var(--tt-muted)]">
                  Nothing scheduled yet.
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {[...groups.entries()].map(([date, dayTasks]) => (
                  <div key={date}>
                    <div className="sticky top-0 z-10 mb-1.5 flex items-center gap-2 bg-[var(--tt-panel)]/90 py-1 backdrop-blur">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full tt-meta font-extrabold ${ date === today ? "bg-[var(--tt-accent-strong)] text-white" : "bg-[var(--tt-panel-alt)] text-[var(--tt-text)] dark:bg-[var(--tt-panel-alt)] dark:text-[var(--tt-muted)]" }`}
                      >
                        {Number(date.slice(8, 10))}
                      </span>
                      <span className="tt-overline font-semibold tracking-wide text-[var(--tt-muted)]">
                        {new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {date === today && (
                        <span className="rounded-full bg-[var(--tt-accent)]/15 px-1.5 py-0.5 tt-meta font-bold text-[var(--tt-accent-text)]">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5 pl-8">
                      {dayTasks.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onSelectTask(t.id)}
                          className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-all ${getTaskPriorityColor( t.priority )} ${t.completed ? "line-through opacity-50" : ""}`}
                        >
                          {t.dueTime && (
                            <span className="flex-shrink-0 font-mono tt-meta opacity-80">
                              {t.dueTime}
                            </span>
                          )}
                          <span className="flex-1 truncate tt-label font-medium">{t.title}</span>
                          {t.list?.name && (
                            <span className="flex-shrink-0 tt-meta opacity-70">
                              {t.list.name}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* YEAR VIEW */}
      {viewMode === "year" && (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, monthIndex) => {
              const mFirst = new Date(year, monthIndex, 1);
              const mLast = new Date(year, monthIndex + 1, 0);
              const offset = (mFirst.getDay() + 6) % 7;
              const monthTasks = tasks.filter(
                (t) => t.dueDate && t.dueDate.startsWith(`${year}-${String(monthIndex + 1).padStart(2, "0")}`)
              );

              return (
                <div
                  key={monthIndex}
                  className="rounded-xl border border-[var(--tt-border)] bg-[var(--tt-panel-alt)]/50 p-2"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="tt-meta font-extrabold uppercase tracking-wide text-[var(--tt-muted)]">
                      {mFirst.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span className="rounded-full bg-[var(--tt-panel-alt)]/70 px-1.5 tt-meta font-bold text-[var(--tt-muted)]">
                      {monthTasks.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 text-center tt-meta text-[var(--tt-muted)]">
                    {weekDays.map((d) => (
                      <span key={d}>{d.charAt(0)}</span>
                    ))}
                  </div>
                  <div className="mt-0.5 grid grid-cols-7 gap-0.5">
                    {Array.from({ length: offset }).map((_, i) => (
                      <span key={`e-${i}`} />
                    ))}
                    {Array.from({ length: mLast.getDate() }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const iso = toISODate(new Date(year, monthIndex, dayNum));
                      const dayCount = tasks.filter((t) => t.dueDate === iso).length;
                      const isToday = iso === today;
                      return (
                        <span
                          key={dayNum}
                          title={`${iso}: ${dayCount} task(s)`}
                          className={`flex h-4 items-center justify-center rounded tt-meta ${ isToday ? "bg-[var(--tt-accent-strong)] font-bold text-white" : dayCount > 0 ? "bg-[var(--tt-accent)]/20 font-semibold text-[var(--tt-accent-text)] dark:text-[var(--tt-accent-text)]" : "text-[var(--tt-muted)]" }`}
                        >
                          {dayNum}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
