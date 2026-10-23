"use client";

import React, { useMemo, useState } from "react";
import { addDays, addHours, addMinutes, differenceInMinutes, format, setHours, setMinutes, subDays } from "date-fns";
import {
  type CalendarEvent,
  type EventColor,
  EventCalendar,
} from "@/components/event-calendar";
import { Task } from "@/hooks/use-ticktick";
import { useTickTickContext } from "@/context/ticktick-context";

// Sample events data provided for rich initial demonstration when tasks are few
export const sampleEvents: CalendarEvent[] = [
  {
    allDay: true,
    color: "sky",
    description: "Strategic planning for next year",
    end: subDays(new Date(), 23),
    id: "sample-1",
    location: "Main Conference Hall",
    start: subDays(new Date(), 24),
    title: "Annual Planning",
  },
  {
    color: "amber",
    description: "Submit final deliverables",
    end: setMinutes(setHours(subDays(new Date(), 9), 15), 30),
    id: "sample-2",
    location: "Office",
    start: setMinutes(setHours(subDays(new Date(), 9), 13), 0),
    title: "Project Deadline",
  },
  {
    allDay: true,
    color: "orange",
    description: "Strategic planning for next year",
    end: subDays(new Date(), 13),
    id: "sample-3",
    location: "Main Conference Hall",
    start: subDays(new Date(), 13),
    title: "Quarterly Budget Review",
  },
  {
    color: "sky",
    description: "Weekly team sync",
    end: setMinutes(setHours(new Date(), 11), 0),
    id: "sample-4",
    location: "Conference Room A",
    start: setMinutes(setHours(new Date(), 10), 0),
    title: "Team Meeting",
  },
  {
    color: "emerald",
    description: "Discuss new project requirements",
    end: setMinutes(setHours(addDays(new Date(), 1), 13), 15),
    id: "sample-5",
    location: "Downtown Cafe",
    start: setMinutes(setHours(addDays(new Date(), 1), 12), 0),
    title: "Lunch with Client",
  },
  {
    allDay: true,
    color: "violet",
    description: "New product release",
    end: addDays(new Date(), 6),
    id: "sample-6",
    start: addDays(new Date(), 3),
    title: "Product Launch",
  },
  {
    color: "rose",
    description: "Discuss about new clients",
    end: setMinutes(setHours(addDays(new Date(), 5), 14), 45),
    id: "sample-7",
    location: "Downtown Cafe",
    start: setMinutes(setHours(addDays(new Date(), 4), 14), 30),
    title: "Sales Conference",
  },
  {
    color: "orange",
    description: "Weekly team sync",
    end: setMinutes(setHours(addDays(new Date(), 5), 10), 30),
    id: "sample-8",
    location: "Conference Room A",
    start: setMinutes(setHours(addDays(new Date(), 5), 9), 0),
    title: "Team Meeting",
  },
  {
    color: "sky",
    description: "Weekly team sync",
    end: setMinutes(setHours(addDays(new Date(), 5), 15), 30),
    id: "sample-9",
    location: "Conference Room A",
    start: setMinutes(setHours(addDays(new Date(), 5), 14), 0),
    title: "Review contracts",
  },
  {
    color: "amber",
    description: "Weekly team sync",
    end: setMinutes(setHours(addDays(new Date(), 5), 11), 0),
    id: "sample-10",
    location: "Conference Room A",
    start: setMinutes(setHours(addDays(new Date(), 5), 9), 45),
    title: "Team Meeting",
  },
  {
    color: "emerald",
    description: "Quarterly marketing planning",
    end: setMinutes(setHours(addDays(new Date(), 9), 15), 30),
    id: "sample-11",
    location: "Marketing Department",
    start: setMinutes(setHours(addDays(new Date(), 9), 10), 0),
    title: "Marketing Strategy Session",
  },
  {
    allDay: true,
    color: "sky",
    description: "Presentation of yearly results",
    end: addDays(new Date(), 17),
    id: "sample-12",
    location: "Grand Conference Center",
    start: addDays(new Date(), 17),
    title: "Annual Shareholders Meeting",
  },
  {
    color: "rose",
    description: "Brainstorming for new features",
    end: setMinutes(setHours(addDays(new Date(), 27), 17), 0),
    id: "sample-13",
    location: "Innovation Lab",
    start: setMinutes(setHours(addDays(new Date(), 26), 9), 0),
    title: "Product Development Workshop",
  },
];

interface TaskCalendarViewProps {
  tasks?: Task[];
  onSelectTask?: (taskId: string) => void;
  onAddTaskForDate?: (dateIso: string) => void;
}

export function TaskCalendarView({
  tasks: propTasks,
  onSelectTask,
  onAddTaskForDate,
}: TaskCalendarViewProps) {
  const context = useTickTickContext();
  const tasks = propTasks || context.tasks || [];
  const lists = context.lists || [];
  const activeListId = context.activeListId;

  // Local state for sample events if user wants to discard or edit them
  const [samples, setSamples] = useState<CalendarEvent[]>(sampleEvents);

  // Convert tasks to calendar events
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
          end = addDays(start, 1);
        } else {
          end = addHours(start, 1);
        }

        // Priority to color mapping
        let color: EventColor = "sky";
        if (t.priority === 3) color = "rose";
        else if (t.priority === 2) color = "amber";
        else if (t.priority === 1) color = "sky";
        else if (t.list?.color) {
          const lc = t.list.color.toLowerCase();
          if (lc.includes("rose") || lc.includes("red")) color = "rose";
          else if (lc.includes("amber") || lc.includes("yellow") || lc.includes("orange")) color = "amber";
          else if (lc.includes("emerald") || lc.includes("green")) color = "emerald";
          else if (lc.includes("violet") || lc.includes("purple")) color = "violet";
          else color = "sky";
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
        };
      });
  }, [tasks]);

  // Combine task events and samples (showing samples only if scheduled tasks are few)
  const combinedEvents = useMemo(() => {
    if (taskEvents.length >= 8) {
      return taskEvents;
    }
    // Filter out samples that have been deleted or overridden
    return [...taskEvents, ...samples];
  }, [taskEvents, samples]);

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
      await context.addTask({
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
    } else {
      onAddTaskForDate?.(startDateStr);
    }
  };

  const handleEventUpdate = async (updatedEvent: CalendarEvent) => {
    // If it's a sample event, convert it into a real persisted task!
    const isSample = updatedEvent.id.startsWith("sample-");

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

    if (isSample) {
      // Remove sample from local state and save as a real task
      setSamples((prev) => prev.filter((s) => s.id !== updatedEvent.id));
      if (context.addTask) {
        await context.addTask({
          title: updatedEvent.title,
          description: updatedEvent.description,
          dueDate: startDateStr,
          dueTime: startTimeStr || undefined,
          startDate: startDateStr,
          startTime: startTimeStr || undefined,
          endDate: endDateStr,
          endTime: endTimeStr || undefined,
          durationMinutes: duration > 0 ? duration : 60,
          priority,
          listId: updatedEvent.listId || activeListId || null,
        });
      }
    } else if (context.updateTask) {
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
    if (eventId.startsWith("sample-")) {
      setSamples((prev) => prev.filter((s) => s.id !== eventId));
    } else if (context.deleteTask) {
      await context.deleteTask({ taskId: eventId });
    }
  };

  const handleEventToggleComplete = (eventId: string, completed: boolean) => {
    if (!eventId.startsWith("sample-") && context.toggleComplete) {
      context.toggleComplete({ taskId: eventId, completed });
    }
  };

  const handleOpenTaskDetails = (taskId: string) => {
    if (context.setSelectedTaskId) {
      context.setSelectedTaskId(taskId);
    }
    onSelectTask?.(taskId);
  };

  return (
    <EventCalendar
      events={combinedEvents}
      lists={lists}
      onEventAdd={handleEventAdd}
      onEventDelete={handleEventDelete}
      onEventUpdate={handleEventUpdate}
      onEventToggleComplete={handleEventToggleComplete}
      onOpenTaskDetails={handleOpenTaskDetails}
      className="flex-1"
    />
  );
}
