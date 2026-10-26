"use client";

import { RiCalendarLine, RiDeleteBinLine } from "@remixicon/react";
import { format, isBefore } from "date-fns";
import { ExternalLink } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  CalendarEvent,
  EventColor,
} from "@/components/event-calendar";
import {
  DefaultEndHour,
  DefaultStartHour,
  EndHour,
  StartHour,
} from "@/components/event-calendar/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface EventDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  onOpenTaskDetails?: (taskId: string) => void;
  lists?: Array<{ id: string; name: string; color?: string }>;
}

export function EventDialog({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onOpenTaskDetails,
  lists = [],
}: EventDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState(`${DefaultStartHour}:00`);
  const [endTime, setEndTime] = useState(`${DefaultEndHour}:00`);
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [color, setColor] = useState<EventColor>("sky");
  const [completed, setCompleted] = useState(false);
  const [listId, setListId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setStartDate(new Date());
    setEndDate(new Date());
    setStartTime(`${DefaultStartHour}:00`);
    setEndTime(`${DefaultEndHour}:00`);
    setAllDay(false);
    setLocation("");
    setColor("sky");
    setCompleted(false);
    setListId(null);
    setError(null);
  }, []);

  const formatTimeForInput = useCallback((date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = Math.floor(date.getMinutes() / 15) * 15;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");

      const start = new Date(event.start);
      const end = new Date(event.end);

      setStartDate(start);
      setEndDate(end);
      setStartTime(formatTimeForInput(start));
      setEndTime(formatTimeForInput(end));
      setAllDay(event.allDay || false);
      setLocation(event.location || "");
      setColor((event.color as EventColor) || "sky");
      setCompleted(Boolean(event.completed));
      setListId(event.listId || null);
      setError(null);
    } else {
      resetForm();
    }
  }, [event, formatTimeForInput, resetForm]);

  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = StartHour; hour <= EndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        const value = `${formattedHour}:${formattedMinute}`;
        const date = new Date(2000, 0, 1, hour, minute);
        const label = format(date, "h:mm a");
        options.push({ label, value });
      }
    }
    return options;
  }, []);

  const handleSave = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!allDay) {
      const [startHours = 0, startMinutes = 0] = startTime
        .split(":")
        .map(Number);
      const [endHours = 0, endMinutes = 0] = endTime.split(":").map(Number);

      if (
        startHours < StartHour ||
        startHours > EndHour ||
        endHours < StartHour ||
        endHours > EndHour
      ) {
        setError(
          `Selected time must be between ${StartHour}:00 and ${EndHour}:00`,
        );
        return;
      }

      start.setHours(startHours, startMinutes, 0);
      end.setHours(endHours, endMinutes, 0);
    } else {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    if (isBefore(end, start)) {
      setError("End date cannot be before start date");
      return;
    }

    const eventTitle = title.trim() ? title : "New Task";

    let priority = 0;
    if (color === "rose") priority = 3;
    else if (color === "amber") priority = 2;
    else if (color === "sky") priority = 1;

    onSave({
      allDay,
      color,
      completed,
      description,
      end,
      id: event?.id || "",
      listId: listId === "inbox" ? null : listId,
      location,
      priority,
      start,
      title: eventTitle,
    });
  };

  const handleDelete = () => {
    if (event?.id) {
      onDelete(event.id);
    }
  };

  const colorOptions: Array<{
    value: EventColor;
    label: string;
    bgClass: string;
    borderClass: string;
  }> = [
    {
      bgClass: "bg-rose-500 data-[state=checked]:bg-rose-500",
      borderClass: "border-rose-500 data-[state=checked]:border-rose-500",
      label: "High Priority",
      value: "rose",
    },
    {
      bgClass: "bg-amber-500 data-[state=checked]:bg-amber-500",
      borderClass: "border-amber-500 data-[state=checked]:border-amber-500",
      label: "Medium Priority",
      value: "amber",
    },
    {
      bgClass: "bg-sky-500 data-[state=checked]:bg-sky-500",
      borderClass: "border-sky-500 data-[state=checked]:border-sky-500",
      label: "Low Priority",
      value: "sky",
    },
    {
      bgClass: "bg-emerald-500 data-[state=checked]:bg-emerald-500",
      borderClass: "border-emerald-500 data-[state=checked]:border-emerald-500",
      label: "Emerald",
      value: "emerald",
    },
    {
      bgClass: "bg-violet-500 data-[state=checked]:bg-violet-500",
      borderClass: "border-violet-500 data-[state=checked]:border-violet-500",
      label: "Violet",
      value: "violet",
    },
    {
      bgClass: "bg-orange-500 data-[state=checked]:bg-orange-400",
      borderClass: "border-orange-500 data-[state=checked]:border-orange-400",
      label: "Orange",
      value: "orange",
    },
  ];

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className="sm:max-w-[480px] bg-[var(--app-panel)] border-[var(--app-border)] text-[var(--app-text)]">
        <DialogHeader>
          <DialogTitle className="app-heading font-semibold text-[var(--app-text)]">
            {event?.id ? "Edit Task" : "New Scheduled Task"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {event?.id
              ? "Edit task schedule and details"
              : "Create a new scheduled task"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-rose-500/15 border border-rose-500/30 px-3 py-2 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-3.5 py-2 max-h-[70vh] overflow-y-auto pr-1">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="title" className="app-label text-[var(--app-text)]">
              Task Title
            </Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              onChange={(e) => setTitle(e.target.value)}
              value={title}
              className="bg-[var(--app-panel-alt)] border-[var(--app-border)] text-[var(--app-text)] placeholder:text-[var(--app-muted)] focus-visible:ring-[var(--app-accent)]"
            />
          </div>

          {/* List selection */}
          {lists.length > 0 && (
            <div className="space-y-1">
              <Label htmlFor="task-list" className="app-label text-[var(--app-text)]">
                List
              </Label>
              <Select
                value={listId || "inbox"}
                onValueChange={(val) => setListId(val === "inbox" ? null : val)}
              >
                <SelectTrigger
                  id="task-list"
                  className="bg-[var(--app-panel-alt)] border-[var(--app-border)] text-[var(--app-text)]"
                >
                  <SelectValue placeholder="Inbox" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--app-panel)] border-[var(--app-border)] text-[var(--app-text)]">
                  <SelectItem value="inbox">Inbox</SelectItem>
                  {lists.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Start Date & Time */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="start-date" className="app-label text-[var(--app-text)]">
                Start / Due Date
              </Label>
              <Popover onOpenChange={setStartDateOpen} open={startDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    className={cn(
                      "w-full justify-between border-[var(--app-border)] bg-[var(--app-panel-alt)] px-3 font-normal text-[var(--app-text)] hover:bg-[var(--app-panel-alt)]/80",
                      !startDate && "text-[var(--app-muted)]",
                    )}
                    id="start-date"
                    variant="outline"
                  >
                    <span className="truncate">
                      {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
                    </span>
                    <RiCalendarLine
                      aria-hidden="true"
                      className="shrink-0 text-[var(--app-muted)]"
                      size={16}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-2 bg-[var(--app-panel)] border-[var(--app-border)]">
                  <Calendar
                    defaultMonth={startDate}
                    mode="single"
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date);
                        if (isBefore(endDate, date)) {
                          setEndDate(date);
                        }
                        setStartDateOpen(false);
                      }
                    }}
                    selected={startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="w-32 space-y-1">
                <Label htmlFor="start-time" className="app-label text-[var(--app-text)]">
                  Start Time
                </Label>
                <Select onValueChange={setStartTime} value={startTime}>
                  <SelectTrigger
                    id="start-time"
                    className="bg-[var(--app-panel-alt)] border-[var(--app-border)] text-[var(--app-text)]"
                  >
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--app-panel)] border-[var(--app-border)] text-[var(--app-text)] max-h-56">
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* End Date & Time */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="end-date" className="app-label text-[var(--app-text)]">
                End Date
              </Label>
              <Popover onOpenChange={setEndDateOpen} open={endDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    className={cn(
                      "w-full justify-between border-[var(--app-border)] bg-[var(--app-panel-alt)] px-3 font-normal text-[var(--app-text)] hover:bg-[var(--app-panel-alt)]/80",
                      !endDate && "text-[var(--app-muted)]",
                    )}
                    id="end-date"
                    variant="outline"
                  >
                    <span className="truncate">
                      {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
                    </span>
                    <RiCalendarLine
                      aria-hidden="true"
                      className="shrink-0 text-[var(--app-muted)]"
                      size={16}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-2 bg-[var(--app-panel)] border-[var(--app-border)]">
                  <Calendar
                    defaultMonth={endDate}
                    disabled={{ before: startDate }}
                    mode="single"
                    onSelect={(date) => {
                      if (date) {
                        setEndDate(date);
                        setEndDateOpen(false);
                      }
                    }}
                    selected={endDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="w-32 space-y-1">
                <Label htmlFor="end-time" className="app-label text-[var(--app-text)]">
                  End Time
                </Label>
                <Select onValueChange={setEndTime} value={endTime}>
                  <SelectTrigger
                    id="end-time"
                    className="bg-[var(--app-panel-alt)] border-[var(--app-border)] text-[var(--app-text)]"
                  >
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--app-panel)] border-[var(--app-border)] text-[var(--app-text)] max-h-56">
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* All day & Completed Toggles */}
          <div className="flex items-center justify-between py-1 border-y border-[var(--app-border)]/60">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allDay}
                id="all-day"
                onCheckedChange={(checked) => setAllDay(checked === true)}
              />
              <Label htmlFor="all-day" className="app-label text-[var(--app-text)] cursor-pointer">
                All day
              </Label>
            </div>

            {event?.id && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={completed}
                  id="task-completed"
                  onCheckedChange={(checked) => setCompleted(checked === true)}
                />
                <Label htmlFor="task-completed" className="app-label text-[var(--app-text)] cursor-pointer">
                  Completed
                </Label>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="desc" className="app-label text-[var(--app-text)]">
              Description / Notes
            </Label>
            <Textarea
              id="desc"
              rows={2}
              placeholder="Add description..."
              onChange={(e) => setDescription(e.target.value)}
              value={description}
              className="bg-[var(--app-panel-alt)] border-[var(--app-border)] text-[var(--app-text)] placeholder:text-[var(--app-muted)] resize-none"
            />
          </div>

          {/* Priority & Color */}
          <fieldset className="space-y-2">
            <legend className="app-label font-medium text-[var(--app-text)]">
              Priority & Color
            </legend>
            <RadioGroup
              className="flex items-center gap-2"
              defaultValue={colorOptions[0]?.value}
              onValueChange={(value: EventColor) => setColor(value)}
              value={color}
            >
              {colorOptions.map((colorOption) => (
                <RadioGroupItem
                  aria-label={colorOption.label}
                  title={colorOption.label}
                  className={cn(
                    "size-6 shadow-none cursor-pointer rounded-full transition-transform hover:scale-110",
                    colorOption.bgClass,
                    colorOption.borderClass,
                  )}
                  id={`color-${colorOption.value}`}
                  key={colorOption.value}
                  value={colorOption.value}
                />
              ))}
            </RadioGroup>
          </fieldset>
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 pt-3 border-t border-[var(--app-border)]">
          <div className="flex items-center gap-2">
            {event?.id && (
              <Button
                aria-label="Delete task"
                onClick={handleDelete}
                size="sm"
                variant="destructive"
                className="gap-1.5"
              >
                <RiDeleteBinLine aria-hidden="true" size={15} />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            )}

            {event?.id && onOpenTaskDetails && (
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTaskDetails(event.id);
                }}
                size="sm"
                variant="outline"
                className="gap-1.5 border-[var(--app-border)] bg-[var(--app-panel-alt)] text-[var(--app-text)] hover:bg-[var(--app-panel-alt)]/80"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Full Details</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="border-[var(--app-border)] bg-[var(--app-panel-alt)] text-[var(--app-text)] hover:bg-[var(--app-panel-alt)]/80"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-[var(--app-accent-strong)] text-white hover:bg-[var(--app-accent-strong)]/90"
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
