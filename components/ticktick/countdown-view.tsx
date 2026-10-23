"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  PartyPopper,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface Countdown {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  targetDate: string;
  /** hex accent, e.g. #4772fa */
  color: string;
  emoji?: string | null;
  repeat: string;
}

export interface CountdownViewProps {
  countdowns: Countdown[];
  onAddCountdown: (input: {
    title: string;
    targetDate: string;
    color?: string;
    emoji?: string;
    repeat?: string;
  }) => void | Promise<void>;
  onUpdateCountdown: (
    id: string,
    updates: Partial<Countdown>
  ) => void | Promise<void>;
  onDeleteCountdown: (id: string) => void | Promise<void>;
}

const PRESET_COLORS = [
  "#4772fa",
  "#12b886",
  "#f59f00",
  "#e03131",
  "#7950f2",
  "#e64980",
  "#1c7ed6",
  "#7048e8",
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

interface FormState {
  title: string;
  targetDate: string;
  emoji: string;
  color: string;
  repeatYearly: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  targetDate: "",
  emoji: "",
  color: PRESET_COLORS[0],
  repeatYearly: false,
};

function parseTargetDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function formatAbsoluteDate(value: string): string {
  const date = parseTargetDate(value);
  if (!date) return value;
  try {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

/** Add (or subtract) whole years, clamping Feb 29 to Feb 28 in non-leap years. */
function addYears(date: Date, years: number): Date {
  const targetYear = date.getFullYear() + years;
  const month = date.getMonth();
  const day = date.getDate();
  const lastDayOfMonth = new Date(targetYear, month + 1, 0).getDate();
  return new Date(targetYear, month, Math.min(day, lastDayOfMonth));
}

/** Next yearly occurrence of a YYYY-MM-DD date strictly after `now`. */
function nextYearlyOccurrence(value: string, now: number): Date | null {
  const base = parseTargetDate(value);
  if (!base) return null;
  let candidate = new Date(base.getTime());
  let guard = 0;
  while (candidate.getTime() <= now && guard < 400) {
    candidate = addYears(candidate, 1);
    guard += 1;
  }
  return candidate;
}

interface ResolvedCountdown {
  countdown: Countdown;
  /** the moment the countdown is actually aiming at */
  target: Date | null;
  /** period start used for the progress indicator */
  periodStart: Date | null;
  isPassed: boolean;
  /** yearly events roll over to their next occurrence */
  isRollover: boolean;
}

function resolveCountdown(countdown: Countdown, now: number): ResolvedCountdown {
  const base = parseTargetDate(countdown.targetDate);
  const repeats = (countdown.repeat || "NONE").toUpperCase() === "YEARLY";

  if (!base) {
    return {
      countdown,
      target: null,
      periodStart: null,
      isPassed: true,
      isRollover: false,
    };
  }

  if (repeats) {
    const next = nextYearlyOccurrence(countdown.targetDate, now);
    if (!next) {
      return {
        countdown,
        target: null,
        periodStart: null,
        isPassed: true,
        isRollover: false,
      };
    }
    const periodStart = addYears(next, -1);
    return {
      countdown,
      target: next,
      periodStart,
      isPassed: false,
      isRollover: next.getTime() !== base.getTime(),
    };
  }

  const isPassed = base.getTime() <= now;
  const periodStart = addYears(base, -1);
  return {
    countdown,
    target: base,
    periodStart,
    isPassed,
    isRollover: false,
  };
}

function splitDuration(ms: number) {
  const clamped = Math.max(0, ms);
  return {
    days: Math.floor(clamped / DAY_MS),
    hours: Math.floor((clamped % DAY_MS) / (60 * 60 * 1000)),
    minutes: Math.floor((clamped % (60 * 60 * 1000)) / (60 * 1000)),
    seconds: Math.floor((clamped % (60 * 1000)) / 1000),
  };
}

function withAlpha(hex: string, alpha: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return `${hex}${alpha}`;
  return `#${clean}${alpha}`;
}

function UnitBox({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl border border-[var(--tt-border)] bg-[var(--tt-panel-alt)]/80 px-1 py-2">
      <span
        className="font-mono text-2xl leading-none font-semibold tabular-nums tracking-tight"
        style={{ color }}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="tt-meta font-bold tracking-wider text-[var(--tt-muted)] uppercase">
        {label}
      </span>
    </div>
  );
}

export function CountdownView({
  countdowns,
  onAddCountdown,
  onUpdateCountdown,
  onDeleteCountdown,
}: CountdownViewProps) {
  const [now, setNow] = useState(() => Date.now());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live ticking clock shared by every card.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset the "click delete again" affordance.
  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const resolved = useMemo(
    () => countdowns.map((c) => resolveCountdown(c, now)),
    [countdowns, now]
  );

  const sorted = useMemo(() => {
    const upcoming = resolved
      .filter((r) => !r.isPassed)
      .sort((a, b) => (a.target?.getTime() ?? 0) - (b.target?.getTime() ?? 0));
    const past = resolved
      .filter((r) => r.isPassed)
      .sort((a, b) => (b.target?.getTime() ?? 0) - (a.target?.getTime() ?? 0));
    return [...upcoming, ...past];
  }, [resolved]);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((countdown: Countdown) => {
    setEditingId(countdown.id);
    setForm({
      title: countdown.title ?? "",
      targetDate: countdown.targetDate ?? "",
      emoji: countdown.emoji ?? "",
      color: countdown.color || PRESET_COLORS[0],
      repeatYearly: (countdown.repeat || "NONE").toUpperCase() === "YEARLY",
    });
    setError(null);
    setDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const title = form.title.trim();
      const targetDate = form.targetDate.trim();

      if (!title) {
        setError("Give your countdown a title.");
        return;
      }
      if (!targetDate) {
        setError("Pick a target date.");
        return;
      }
      if (!parseTargetDate(targetDate)) {
        setError("That date doesn't look valid.");
        return;
      }

      setError(null);

      const payload = {
        title,
        targetDate,
        color: form.color,
        emoji: form.emoji.trim(),
        repeat: form.repeatYearly ? "YEARLY" : "NONE",
      };

      if (editingId) {
        await onUpdateCountdown(editingId, payload);
      } else {
        await onAddCountdown(payload);
      }

      setDialogOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
    [editingId, form, onAddCountdown, onUpdateCountdown]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (confirmingId === id) {
        setConfirmingId(null);
        if (confirmTimer.current) clearTimeout(confirmTimer.current);
        void onDeleteCountdown(id);
        return;
      }
      setConfirmingId(id);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmingId(null), 4000);
    },
    [confirmingId, onDeleteCountdown]
  );

  const isEditing = editingId !== null;

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header strip */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="tt-body text-[var(--tt-muted)]">
            Keep track of the dates that matter — birthdays, anniversaries, deadlines
            and launches.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="shrink-0 self-start rounded-xl px-3 py-1.5 font-semibold sm:self-auto"
        >
          <Plus className="size-4" />
          New countdown
        </Button>
      </div>

      {/* Cards */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--tt-border)] bg-[var(--tt-panel)] px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--tt-panel-alt)] text-[var(--tt-muted)]">
            <PartyPopper className="size-6" />
          </span>
          <h3 className="tt-heading font-semibold text-[var(--tt-text)]">
            No countdowns yet
          </h3>
          <p className="max-w-sm tt-body text-[var(--tt-muted)]">
            Add a date you are looking forward to and we will count every second
            until it arrives.
          </p>
          <Button type="button" onClick={openCreate} className="mt-1 rounded-xl px-3 py-1.5 font-semibold">
            <Plus className="size-4" />
            Create your first countdown
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map(({ countdown, target, periodStart, isPassed, isRollover }) => {
            const color = countdown.color || PRESET_COLORS[0];
            const targetTime = target ? target.getTime() : 0;
            const remaining = target ? targetTime - now : 0;
            const units = splitDuration(remaining);
            const elapsedSinceTarget = isPassed && target ? now - targetTime : 0;
            const total = periodStart && target ? targetTime - periodStart.getTime() : 0;
            const elapsed = periodStart ? now - periodStart.getTime() : 0;
            const progress =
              isPassed || total <= 0 ? 1 : Math.min(1, Math.max(0, elapsed / total));
            const progressPercent = Math.round(progress * 100);
            const confirming = confirmingId === countdown.id;

            return (
              <div
                key={countdown.id}
                className="flex flex-col gap-4 rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel)] p-4 shadow-sm transition-colors"
              >
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                      style={{
                        backgroundColor: withAlpha(color, "1f"),
                        color,
                      }}
                    >
                      {countdown.emoji ? (
                        <span className="leading-none">{countdown.emoji}</span>
                      ) : (
                        <PartyPopper className="size-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate tt-heading font-semibold text-[var(--tt-text)]">
                        {countdown.title}
                      </h3>
                      <span className="mt-0.5 flex items-center gap-1.5 tt-label text-[var(--tt-muted)]">
                        <CalendarDays className="size-3.5 shrink-0" />
                        <span className="truncate">
                          {formatAbsoluteDate(countdown.targetDate)}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(countdown)}
                      aria-label={`Edit ${countdown.title}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--tt-muted)] transition-colors hover:bg-[var(--tt-panel-alt)] hover:text-[var(--tt-text)] dark:hover:text-[var(--tt-text)]"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(countdown.id)}
                      aria-label={`Delete ${countdown.title}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--tt-muted)] transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {confirming && (
                  <p className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 tt-label font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                    <Trash2 className="size-3.5" />
                    Click delete again to confirm
                  </p>
                )}

                {/* Countdown / passed state */}
                {isPassed ? (
                  <div className="flex flex-col gap-2 rounded-xl border border-[var(--tt-border)] bg-[var(--tt-panel-alt)]/80 p-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-[var(--tt-panel-alt)] px-2 py-0.5 tt-meta font-bold tracking-wider text-[var(--tt-text)] uppercase">
                        Ended
                      </span>
                      <span className="tt-label font-medium text-[var(--tt-muted)]">
                        Passed {splitDuration(elapsedSinceTarget).days} day
                        {splitDuration(elapsedSinceTarget).days === 1 ? "" : "s"} ago
                      </span>
                    </div>
                    <p className="tt-label text-[var(--tt-muted)]">
                      This countdown has passed
                      {(countdown.repeat || "NONE").toUpperCase() === "YEARLY"
                        ? " and does not repeat."
                        : "."}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-stretch gap-2">
                    <UnitBox value={units.days} label="Days" color={color} />
                    <UnitBox value={units.hours} label="Hours" color={color} />
                    <UnitBox value={units.minutes} label="Mins" color={color} />
                    <UnitBox value={units.seconds} label="Secs" color={color} />
                  </div>
                )}

                {/* Progress bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between tt-meta font-bold tracking-wide text-[var(--tt-muted)] uppercase">
                    <span>
                      {isPassed ? "Completed" : "Elapsed"}
                      {isRollover ? " · next occurrence" : ""}
                    </span>
                    <span className="tabular-nums">{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--tt-panel-alt)]">
                    <div
                      className="h-full rounded-full transition-[width] duration-500 ease-linear"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(countdown.repeat || "NONE").toUpperCase() === "YEARLY" && (
                    <span className="rounded-lg border border-[var(--tt-border)] px-2 py-0.5 tt-meta font-bold tracking-wider text-[var(--tt-muted)] uppercase">
                      Repeats yearly
                    </span>
                  )}
                  {isRollover && (
                    <span className="rounded-lg border border-[var(--tt-border)] px-2 py-0.5 tt-meta font-bold tracking-wider text-[var(--tt-muted)] uppercase">
                      Next: {target ? formatAbsoluteDate(toDateInput(target)) : ""}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / edit dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open: boolean) => {
          setDialogOpen(open);
          if (!open) {
            setError(null);
            setEditingId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-extrabold tracking-tight">
              {isEditing ? "Edit countdown" : "New countdown"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the details of this countdown."
                : "Pick a date and we will count down the seconds."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="countdown-title">Title</Label>
              <Input
                id="countdown-title"
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Trip to Kyoto"
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="countdown-date">Target date</Label>
              <input
                id="countdown-date"
                type="date"
                value={form.targetDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, targetDate: event.target.value }))
                }
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 tt-body transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="countdown-emoji">Emoji (optional)</Label>
              <Input
                id="countdown-emoji"
                value={form.emoji}
                maxLength={4}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, emoji: event.target.value }))
                }
                placeholder="🎉"
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Colour</Label>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((preset) => {
                  const selected = form.color.toLowerCase() === preset.toLowerCase();
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, color: preset }))}
                      aria-label={`Use colour ${preset}`}
                      aria-pressed={selected}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110",
                        selected ? "ring-2 ring-[var(--tt-panel)] ring-offset-2 dark:ring-white dark:ring-offset-slate-900" : ""
                      )}
                      style={{ backgroundColor: preset }}
                    >
                      {selected && (
                        <Check className="size-3.5 text-white drop-shadow" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[var(--tt-border)] px-3 py-2.5">
              <div className="flex flex-col">
                <Label htmlFor="countdown-repeat" className="tt-body font-semibold">
                  Repeat yearly
                </Label>
                <span className="tt-label text-[var(--tt-muted)]">
                  Count down to this date every year.
                </span>
              </div>
              <Switch
                id="countdown-repeat"
                checked={form.repeatYearly}
                onCheckedChange={(checked: boolean) =>
                  setForm((prev) => ({ ...prev, repeatYearly: checked }))
                }
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-rose-50 px-3 py-2 tt-label font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
              >
                {error}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl font-semibold">
                {isEditing ? "Save changes" : "Add countdown"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
