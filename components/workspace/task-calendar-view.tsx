"use client";

import React, { useMemo } from "react";
import { addDays, addHours, addMinutes, differenceInMinutes, format } from "date-fns";
import {
  type CalendarEvent,
  type EventColor,
  type CalendarView,
  EventCalendar,
} from "@/components/event-calendar";
import { Task } from "@/hooks/use-workspace";
import { useWorkspaceContext } from "@/context/workspace-context";

interface TaskCalendarViewProps {
  tasks?: Task[];
  onSelectTask?: (taskId: string) => void;
  onAddTaskForDate?: (dateIso: string) => void;
  calView?: CalendarView;
  onCalViewChange?: (view: CalendarView) => void;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
}

export function TaskCalendarView({
  tasks: propTasks,
  onSelectTask,
  onAddTaskForDate,
  calView,
  onCalViewChange,
  currentDate,
  onDateChange,
}: TaskCalendarViewProps) {
  const context = useWorkspaceContext();
  const tasks = propTasks || context.allActiveTasks || context.tasks || [];
  const lists = context.lists || [];
  const activeListId = context.activeListId;
  const [showCompleted, setShowCompleted] = React.useState(true);

  // Convert real tasks to calendar events
  const taskEvents = useMemo<CalendarEvent[]>(() => {
    return tasks
      .filter((t) => !t.isTrash && (t.dueDate || t.startDate))
      .map((t) => {
        let start: Date;
        let allDay = false;
        const dateStr = t.startDate || t.dueDate!;
        const timeStr = t.startTime || t.dueTime;

        if (timeStr) {
          start = new Date(`${dateStr}T${timeStr}:00`);
          allDay = false;
        } else {
          start = new Date(`${dateStr}T09:00:00`);
          allDay = true;
        }

        let end: Date;
        const endDateStr = t.endDate || t.dueDate || dateStr;
        const endTimeStr = t.endTime;

        if (endTimeStr) {
          end = new Date(`${endDateStr}T${endTimeStr}:00`);
        } else if (t.durationMinutes && t.durationMinutes > 0 && !allDay) {
          end = addMinutes(start, t.durationMinutes);
        } else if (allDay) {
          end = new Date(`${endDateStr}T23:59:59`);
        } else {
          end = addHours(start, 1);
        }

        // Priority and list color mapping
        let color: EventColor = "slate";
        if (t.priority === 3) {
          color = "rose";
        } else if (t.priority === 2) {
          color = "amber";
        } else if (t.priority === 1) {
          color = "sky";
        } else if (t.list?.color) {
          const lc = t.list.color.toLowerCase();
          if (lc.includes("rose") || lc.includes("red")) color = "rose";
          else if (lc.includes("amber") || lc.includes("yellow") || lc.includes("orange")) color = "amber";
          else if (lc.includes("emerald") || lc.includes("green")) color = "emerald";
          else if (lc.includes("violet") || lc.includes("purple")) color = "violet";
          else if (lc.includes("sky") || lc.includes("blue")) color = "sky";
          else color = "slate";
        }

        return {
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          start,
          end,
          allDay,
          color,
          completed: t.completed,
          priority: t.priority,
          listId: t.listId,
          listName: t.list?.name,
          listColor: t.list?.color,
          subtaskCount: t.subtasks?.length || 0,
          subtasksCompleted: t.subtasks?.filter((s) => s.completed).length || 0,
          durationMinutes: t.durationMinutes || undefined,
        };
      });
  }, [tasks]);

  const visibleEvents = useMemo(() => {
    return showCompleted ? taskEvents : taskEvents.filter((e) => !e.completed);
  }, [taskEvents, showCompleted]);

  // Event handlers
  const handleEventAdd = async (event: CalendarEvent) => {
    const startDateStr = format(event.start, "yyyy-MM-dd");
    const startTimeStr = event.allDay ? undefined : format(event.start, "HH:mm");
    const endDateStr = format(event.end, "yyyy-MM-dd");
    const endTimeStr = event.allDay ? undefined : format(event.end, "HH:mm");
    const duration = differenceInMinutes(event.end, event.start);

    let priority = event.priority ?? 0;
    if (priority === 0) {
      if (event.color === "rose") priority = 3;
      else if (event.color === "amber") priority = 2;
      else if (event.color === "sky") priority = 1;
    }

    if (context.addTask) {
      const res = await context.addTask({
        title: event.title || "New Task",
        description: event.description,
        dueDate: startDateStr,
        dueTime: startTimeStr,
        startDate: startDateStr,
        startTime: startTimeStr,
        endDate: endDateStr,
        endTime: endTimeStr,
        durationMinutes: duration > 0 ? duration : 60,
        priority,
        listId: event.listId || activeListId || null,
      });

      const created = res?.task;
      if (created?.id) {
        if (context.setSelectedTaskId) {
          context.setSelectedTaskId(created.id);
        }
        onSelectTask?.(created.id);
      }
    } else {
      onAddTaskForDate?.(startDateStr);
    }
  };

  const handleEventUpdate = async (updatedEvent: CalendarEvent) => {
    const startDateStr = format(updatedEvent.start, "yyyy-MM-dd");
    const startTimeStr = updatedEvent.allDay ? null : format(updatedEvent.start, "HH:mm");
    const endDateStr = format(updatedEvent.end, "yyyy-MM-dd");
    const endTimeStr = updatedEvent.allDay ? null : format(updatedEvent.end, "HH:mm");
    const duration = differenceInMinutes(updatedEvent.end, updatedEvent.start);

    let priority = updatedEvent.priority ?? 0;
    if (priority === 0) {
      if (updatedEvent.color === "rose") priority = 3;
      else if (updatedEvent.color === "amber") priority = 2;
      else if (updatedEvent.color === "sky") priority = 1;
    }

    if (context.updateTask) {
      context.updateTask({
        taskId: updatedEvent.id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        dueDate: startDateStr,
        dueTime: startTimeStr,
        startDate: startDateStr,
        startTime: startTimeStr,
        endDate: endDateStr,
        endTime: endTimeStr,
        durationMinutes: duration > 0 ? duration : 60,
        priority,
        completed: updatedEvent.completed,
        listId: updatedEvent.listId,
      });
    }
  };

  const handleEventDelete = async (eventId: string) => {
    if (context.deleteTask) {
      await context.deleteTask({ taskId: eventId });
    }
  };

  const handleEventToggleComplete = (eventId: string, completed: boolean) => {
    if (context.toggleComplete) {
      context.toggleComplete({ taskId: eventId, completed });
    }
  };

  const handleOpenTaskDetails = (taskId: string) => {
    if (context.setSelectedTaskId) {
      context.setSelectedTaskId(taskId);
    }
    onSelectTask?.(taskId);
  };

  const isInitialLoading =
    (context?.isInitialLoadingTasks || (context?.isLoadingTasks && !context?.hasLoadedTasksOnce)) &&
    tasks.length === 0;

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden">
      {isInitialLoading && (
        <div className="absolute top-2.5 right-3 z-30 flex items-center gap-2 rounded-lg border border-[var(--app-border)]/80 bg-[var(--app-panel)]/95 px-3 py-1.5 text-xs text-[var(--app-muted)] shadow-md animate-pulse">
          <div className="h-2 w-2 rounded-full bg-[var(--app-accent)]" />
          <span className="font-medium text-[var(--app-text)]">Syncing calendar tasks…</span>
        </div>
      )}
      <EventCalendar
        events={visibleEvents}
        lists={lists}
        view={calView}
        onViewChange={onCalViewChange}
        currentDate={currentDate}
        onDateChange={onDateChange}
        showCompleted={showCompleted}
        onToggleShowCompleted={() => setShowCompleted((prev) => !prev)}
        onEventAdd={handleEventAdd}
        onEventDelete={handleEventDelete}
        onEventUpdate={handleEventUpdate}
        onEventToggleComplete={handleEventToggleComplete}
        onOpenTaskDetails={handleOpenTaskDetails}
        className="flex-1"
      />
    </div>
  );
}
