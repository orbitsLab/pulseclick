export type CalendarView = "month" | "week" | "day" | "agenda" | "year";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: EventColor;
  location?: string;
  completed?: boolean;
  priority?: number;
  listId?: string | null;
  listName?: string;
  listColor?: string;
  subtaskCount?: number;
  subtasksCompleted?: number;
}

export type EventColor =
  | "sky"
  | "amber"
  | "violet"
  | "rose"
  | "emerald"
  | "orange";
