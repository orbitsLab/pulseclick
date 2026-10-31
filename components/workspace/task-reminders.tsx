"use client";

import React, { useState } from "react";
import { Bell, BellRing, Clock, Plus, Trash2, Repeat } from "lucide-react";

export interface TaskReminder {
  id: string;
  taskId: string;
  type: string;
  remindAt?: string | null;
  minutesBefore?: number | null;
  enabled: boolean;
}

export interface TaskRemindersProps {
  taskId: string;
  reminders: TaskReminder[];
  onCreate: (input: {
    taskId: string;
    type: string;
    remindAt?: string;
    minutesBefore?: number;
  }) => void | Promise<void>;
  onUpdate: (
    id: string,
    updates: Partial<{ type: string; remindAt: string | null; minutesBefore: number | null; enabled: boolean }>
  ) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

const REMINDER_TYPES: { value: string; label: string; minutesBefore?: number }[] = [
  { value: "AT_TIME", label: "At task time" },
  { value: "5_MIN", label: "5 minutes before", minutesBefore: 5 },
  { value: "15_MIN", label: "15 minutes before", minutesBefore: 15 },
  { value: "30_MIN", label: "30 minutes before", minutesBefore: 30 },
  { value: "1_HOUR", label: "1 hour before", minutesBefore: 60 },
  { value: "1_DAY", label: "1 day before", minutesBefore: 1440 },
  { value: "CONSTANT", label: "Constant reminder" },
];

function describeReminder(reminder: TaskReminder): string {
  switch (reminder.type) {
    case "AT_TIME":
      return reminder.remindAt ? `At ${reminder.remindAt}` : "At task time";
    case "CONSTANT":
      return "Keeps ringing until done";
    case "5_MIN":
      return "5 minutes before";
    case "15_MIN":
      return "15 minutes before";
    case "30_MIN":
      return "30 minutes before";
    case "1_HOUR":
      return "1 hour before";
    case "1_DAY":
      return "1 day before";
    default:
      return reminder.type;
  }
}

export function TaskReminders({
  taskId,
  reminders,
  onCreate,
  onUpdate,
  onDelete,
}: TaskRemindersProps) {
  const [type, setType] = useState("AT_TIME");
  const [remindAt, setRemindAt] = useState("09:00");
  const [isAdding, setIsAdding] = useState(false);

  async function handleAdd() {
    const preset = REMINDER_TYPES.find((t) => t.value === type);
    setIsAdding(true);
    try {
      await onCreate({
        taskId,
        type,
        remindAt: type === "AT_TIME" ? remindAt : undefined,
        minutesBefore: preset?.minutesBefore,
      });
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold text-[var(--app-muted)]">
          <Bell className="h-3.5 w-3.5" />
          Reminders
        </h3>
        <span className="rounded-[3px] bg-[var(--app-panel-hover)] px-1.5 py-0.5 text-[11px] font-mono font-medium text-[var(--app-muted)]">
          {reminders.length}
        </span>
      </div>

      {reminders.length === 0 ? (
        <p className="rounded-[6px] bg-[var(--app-panel-hover)] px-3 py-2 text-xs text-[var(--app-muted)]">
          No reminders yet. Add one so this task never slips.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {reminders.map((reminder) => (
            <li
              key={reminder.id}
              className="flex items-center gap-2 rounded-[6px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1.5 text-xs"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] ${ reminder.enabled ? "bg-[var(--app-accent-tag-bg)] text-[var(--app-accent)]" : "bg-[var(--app-panel-hover)] text-[var(--app-muted)]" }`}
              >
                {reminder.type === "CONSTANT" ? (
                  <Repeat className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
              </span>
              <span
                className={`flex-1 truncate text-xs ${ reminder.enabled ? "text-[var(--app-text)]" : "text-[var(--app-muted)] line-through" }`}
              >
                {describeReminder(reminder)}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={reminder.enabled}
                aria-label={`Toggle reminder ${describeReminder(reminder)}`}
                onClick={() => onUpdate(reminder.id, { enabled: !reminder.enabled })}
                className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${ reminder.enabled ? "bg-[var(--app-accent)]" : "bg-[var(--app-border)]" }`}
              >
                <span
                  className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${ reminder.enabled ? "translate-x-3.5" : "translate-x-0.5" }`}
                />
              </button>
              <button
                type="button"
                aria-label="Delete reminder"
                onClick={() => onDelete(reminder.id)}
                className="shrink-0 rounded-[4px] p-1 text-[var(--app-muted)] transition-colors hover:bg-rose-500/10 hover:text-rose-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-1.5">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Reminder type"
          className="flex-1 rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2 py-1.5 text-xs text-[var(--app-text)] outline-none focus:border-[var(--app-accent)]"
        >
          {REMINDER_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {type === "AT_TIME" && (
          <input
            type="time"
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
            aria-label="Reminder time"
            className="rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2 py-1.5 text-xs text-[var(--app-text)] outline-none focus:border-[var(--app-accent)] font-mono"
          />
        )}
        <button
          type="button"
          onClick={handleAdd}
          disabled={isAdding}
          className="flex items-center gap-1 rounded-[4px] bg-[var(--app-accent)] px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--app-accent-hover)] disabled:opacity-50"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>

      {reminders.some((r) => r.type === "CONSTANT") && (
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-[var(--app-muted)]">
          <BellRing className="mt-0.5 h-3 w-3 shrink-0" />
          Constant reminders keep notifying until the task is completed.
        </p>
      )}
    </section>
  );
}
