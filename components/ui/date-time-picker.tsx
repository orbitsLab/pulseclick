"use client"

import * as React from "react"
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfYear,
  isSameDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns"
import type { DateRange, Matcher } from "react-day-picker"
import { CircleCheckIcon } from "lucide-react"

import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

// ============================================================================
// Types
// ============================================================================

export type DateTimePickerMode = "single" | "range"

export interface DateTimePickerValue {
  mode: DateTimePickerMode
  date?: Date
  range?: DateRange
  time?: string
  duration?: number | null
  endTime?: string | null
}

export interface DateTimePickerProps {
  /** Title shown in the card header. Default: "Book your appointment" */
  title?: string

  /** Controlled value */
  value?: Partial<DateTimePickerValue>
  /** Initial uncontrolled default value */
  defaultValue?: Partial<DateTimePickerValue>
  /** Callback fired whenever date, range, time, or duration changes */
  onChange?: (val: DateTimePickerValue) => void
  /** Callback fired when user clicks Continue */
  onConfirm?: (val: DateTimePickerValue) => void

  /** Booked dates displayed with strikethrough */
  bookedDates?: Date[]
  /** Dates that cannot be selected */
  disabledDates?: Date[] | ((date: Date) => boolean)
  /** Minimum selectable date */
  minDate?: Date
  /** Maximum selectable date */
  maxDate?: Date

  /** Booked time slots (e.g. ["10:15", "14:00"]) */
  bookedTimes?: string[]

  /** Whether to show presets section (defaults to true) */
  showPresets?: boolean
  /** Whether to show time slots picker (defaults to true) */
  showTimePicker?: boolean
  /** Whether to show optional duration selector (defaults to true) */
  showDuration?: boolean
  /** Available duration options in minutes. Default: [15, 30, 45, 60] */
  durations?: number[]

  /** Whether to allow toggling between single and range mode. Default: true */
  allowModeSwitch?: boolean

  /** Label for confirm button. Default: "Continue" */
  confirmLabel?: string
  className?: string
}

interface PresetItem {
  id: string
  label: string
  isRange: boolean
  getDate?: (today: Date) => Date
  getRange: (today: Date) => DateRange
}

// ============================================================================
// Presets matching Image 2
// ============================================================================

const PRESETS_ROW_1: PresetItem[] = [
  {
    id: "today",
    label: "Today",
    isRange: false,
    getDate: (today) => today,
    getRange: (today) => ({ from: today, to: today }),
  },
  {
    id: "yesterday",
    label: "Yesterday",
    isRange: false,
    getDate: (today) => subDays(today, 1),
    getRange: (today) => ({ from: subDays(today, 1), to: subDays(today, 1) }),
  },
  {
    id: "tomorrow",
    label: "Tomorrow",
    isRange: false,
    getDate: (today) => addDays(today, 1),
    getRange: (today) => ({ from: today, to: addDays(today, 1) }),
  },
]

const PRESETS_ROW_2: PresetItem[] = [
  {
    id: "last-7-days",
    label: "Last 7 days",
    isRange: true,
    getRange: (today) => ({ from: subDays(today, 6), to: today }),
  },
  {
    id: "next-7-days",
    label: "Next 7 days",
    isRange: true,
    getRange: (today) => ({ from: addDays(today, 1), to: addDays(today, 7) }),
  },
]

const PRESETS_ROW_3: PresetItem[] = [
  {
    id: "last-30-days",
    label: "Last 30 days",
    isRange: true,
    getRange: (today) => ({ from: subDays(today, 29), to: today }),
  },
  {
    id: "month-to-date",
    label: "Month to date",
    isRange: true,
    getRange: (today) => ({ from: startOfMonth(today), to: today }),
  },
]

const PRESETS_ROW_4: PresetItem[] = [
  {
    id: "last-month",
    label: "Last month",
    isRange: true,
    getRange: (today) => ({
      from: startOfMonth(subMonths(today, 1)),
      to: endOfMonth(subMonths(today, 1)),
    }),
  },
  {
    id: "next-month",
    label: "Next month",
    isRange: true,
    getRange: (today) => ({
      from: startOfMonth(addMonths(today, 1)),
      to: endOfMonth(addMonths(today, 1)),
    }),
  },
]

const PRESETS_ROW_5: PresetItem[] = [
  {
    id: "year-to-date",
    label: "Year to date",
    isRange: true,
    getRange: (today) => ({ from: startOfYear(today), to: today }),
  },
  {
    id: "last-year",
    label: "Last year",
    isRange: true,
    getRange: (today) => ({
      from: startOfYear(subYears(today, 1)),
      to: endOfYear(subYears(today, 1)),
    }),
  },
]

// ============================================================================
// Helper: compute end time
// ============================================================================

function computeEndTime(startTime: string, durationMinutes: number): string {
  const [hStr, mStr] = startTime.split(":")
  const total = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + durationMinutes
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

// ============================================================================
// Main Component: DateTimePicker
// ============================================================================

export function DateTimePicker({
  title = "Book your appointment",
  value,
  defaultValue,
  onChange,
  onConfirm,
  bookedDates = [],
  disabledDates,
  minDate,
  maxDate,
  bookedTimes = [],
  showPresets = true,
  showTimePicker = true,
  showDuration = true,
  durations = [15, 30, 45, 60],
  allowModeSwitch = true,
  confirmLabel = "Continue",
  className,
}: DateTimePickerProps) {
  const today = React.useMemo(() => new Date(), [])

  // Controlled vs uncontrolled mode
  const [internalMode, setInternalMode] = React.useState<DateTimePickerMode>(
    defaultValue?.mode ?? (defaultValue?.range ? "range" : "single")
  )
  const mode = value?.mode ?? internalMode

  // Controlled vs uncontrolled single date (default: single date)
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(
    defaultValue?.date ?? (defaultValue?.range ? undefined : today)
  )
  const selectedDate = value?.date !== undefined ? value.date : internalDate

  // Controlled vs uncontrolled date range (only set if range selected)
  const [internalRange, setInternalRange] = React.useState<DateRange | undefined>(
    defaultValue?.range
  )
  const selectedRange = value?.range !== undefined ? value.range : internalRange

  // Calendar month
  const [month, setMonth] = React.useState<Date>(
    selectedDate || selectedRange?.from || today
  )

  // Controlled vs uncontrolled time
  const [internalTime, setInternalTime] = React.useState<string | null>(
    defaultValue?.time ?? "10:00"
  )
  const selectedTime = value?.time !== undefined ? value.time : internalTime

  // Controlled vs uncontrolled duration (optional, default null = single time)
  const [internalDuration, setInternalDuration] = React.useState<number | null>(
    defaultValue?.duration ?? null
  )
  const selectedDuration =
    value?.duration !== undefined ? value.duration : internalDuration

  // Calculated end time if duration is active
  const calculatedEndTime = React.useMemo(() => {
    if (!selectedTime || !selectedDuration) return null
    return computeEndTime(selectedTime, selectedDuration)
  }, [selectedTime, selectedDuration])

  // 37 standard time slots (09:00 to 18:00 every 15 min)
  const timeSlots = React.useMemo(() => {
    return Array.from({ length: 37 }, (_, i) => {
      const totalMinutes = i * 15
      const hour = Math.floor(totalMinutes / 60) + 9
      const minute = totalMinutes % 60
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
    })
  }, [])

  // Combined calendar disabled matcher
  const calendarDisabled = React.useMemo<Matcher | Matcher[] | undefined>(() => {
    const matchers: Matcher[] = []
    if (Array.isArray(disabledDates)) {
      matchers.push(...disabledDates)
    } else if (typeof disabledDates === "function") {
      matchers.push(disabledDates)
    }
    if (minDate) matchers.push({ before: minDate })
    if (maxDate) matchers.push({ after: maxDate })
    return matchers.length > 0 ? matchers : undefined
  }, [disabledDates, minDate, maxDate])

  // Emit changes
  const notifyChange = React.useCallback(
    (updates: Partial<DateTimePickerValue>) => {
      const nextMode = updates.mode ?? mode
      const nextVal: DateTimePickerValue = {
        mode: nextMode,
        date: nextMode === "single" ? (updates.date !== undefined ? updates.date : selectedDate) : undefined,
        range: nextMode === "range" ? (updates.range !== undefined ? updates.range : selectedRange) : undefined,
        time: updates.time !== undefined ? (updates.time ?? undefined) : (selectedTime ?? undefined),
        duration: updates.duration !== undefined ? updates.duration : selectedDuration,
        endTime: updates.endTime !== undefined ? updates.endTime : calculatedEndTime,
      }
      onChange?.(nextVal)
    },
    [mode, selectedDate, selectedRange, selectedTime, selectedDuration, calculatedEndTime, onChange]
  )

  // Check if a preset is currently active
  const isPresetActive = (preset: PresetItem) => {
    if (mode === "single" && !preset.isRange && preset.getDate && selectedDate) {
      return isSameDay(preset.getDate(today), selectedDate)
    }
    if (mode === "range" && preset.isRange && selectedRange?.from && selectedRange?.to) {
      const p = preset.getRange(today)
      return (
        Boolean(p.from && p.to) &&
        isSameDay(p.from!, selectedRange.from) &&
        isSameDay(p.to!, selectedRange.to)
      )
    }
    return false
  }

  // Handle clicking a preset
  const handlePresetClick = (preset: PresetItem) => {
    if (preset.isRange) {
      const nextRange = preset.getRange(today)
      setInternalMode("range")
      setInternalRange(nextRange)
      setInternalDate(undefined)
      if (nextRange.to) setMonth(nextRange.to)
      else if (nextRange.from) setMonth(nextRange.from)
      notifyChange({
        mode: "range",
        range: nextRange,
        date: undefined,
      })
    } else {
      const nextDate = preset.getDate ? preset.getDate(today) : today
      setInternalMode("single")
      setInternalDate(nextDate)
      setInternalRange(undefined)
      setMonth(nextDate)
      notifyChange({
        mode: "single",
        date: nextDate,
        range: undefined,
      })
    }
  }

  // Handle single date select
  const handleSingleSelect = (date: Date | undefined) => {
    setInternalDate(date)
    if (date) setMonth(date)
    notifyChange({ mode: "single", date, range: undefined })
  }

  // Handle range select
  const handleRangeSelect = (range: DateRange | undefined) => {
    setInternalRange(range)
    if (range?.from) setMonth(range.from)
    notifyChange({ mode: "range", range, date: undefined })
  }

  // Handle time select
  const handleTimeSelect = (time: string) => {
    setInternalTime(time)
    const end = selectedDuration ? computeEndTime(time, selectedDuration) : null
    notifyChange({ time, endTime: end })
  }

  // Handle duration select (null = single time slot)
  const handleDurationSelect = (dur: number | null) => {
    setInternalDuration(dur)
    const end = dur && selectedTime ? computeEndTime(selectedTime, dur) : null
    notifyChange({ duration: dur, endTime: end })
  }

  // Handle confirmation
  const handleConfirm = () => {
    onConfirm?.({
      mode,
      date: mode === "single" ? selectedDate : undefined,
      range: mode === "range" ? selectedRange : undefined,
      time: selectedTime ?? undefined,
      duration: selectedDuration,
      endTime: calculatedEndTime,
    })
  }

  // Can continue
  const canContinue = Boolean(
    (mode === "single" ? selectedDate : selectedRange?.from) &&
      (!showTimePicker || selectedTime)
  )

  return (
    <Card className={cn("gap-0 p-0 border border-border bg-card shadow-sm", className)}>
      {/* ================================================================== */}
      {/* Card Header */}
      {/* ================================================================== */}
      <CardHeader className="flex h-max flex-row items-center justify-between border-b px-6 py-4">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        {allowModeSwitch && (
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <Button
              type="button"
              variant={mode === "single" ? "default" : "ghost"}
              size="xs"
              onClick={() => {
                setInternalMode("single")
                if (selectedRange?.from) {
                  setInternalDate(selectedRange.from)
                  setInternalRange(undefined)
                  notifyChange({ mode: "single", date: selectedRange.from, range: undefined })
                }
              }}
              className="h-6 px-2 text-xs"
            >
              Single
            </Button>
            <Button
              type="button"
              variant={mode === "range" ? "default" : "ghost"}
              size="xs"
              onClick={() => {
                setInternalMode("range")
                const fallbackRange = selectedDate
                  ? { from: selectedDate, to: selectedDate }
                  : { from: today, to: addDays(today, 6) }
                setInternalRange(fallbackRange)
                setInternalDate(undefined)
                notifyChange({ mode: "range", range: fallbackRange, date: undefined })
              }}
              className="h-6 px-2 text-xs"
            >
              Range
            </Button>
          </div>
        )}
      </CardHeader>

      {/* ================================================================== */}
      {/* Card Content: [Calendar + Presets] | [Time Slots Column] */}
      {/* ================================================================== */}
      <CardContent className="relative flex flex-col p-0 md:flex-row">
        {/* Left Side: Calendar & Presets */}
        <div className="flex flex-1 flex-col">
          {/* Calendar */}
          <div className="p-6 max-sm:flex max-sm:justify-center">
            {mode === "single" ? (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleSingleSelect}
                month={month}
                onMonthChange={setMonth}
                disabled={calendarDisabled || bookedDates}
                showOutsideDays={false}
                modifiers={{
                  booked: bookedDates,
                }}
                modifiersClassNames={{
                  booked: "[&>button]:line-through opacity-70",
                }}
                className="bg-transparent p-0 [--cell-size:--spacing(10)]"
                formatters={{
                  formatWeekdayName: (date) =>
                    date.toLocaleString("en-US", { weekday: "short" }),
                }}
              />
            ) : (
              <Calendar
                mode="range"
                selected={selectedRange}
                onSelect={handleRangeSelect}
                month={month}
                onMonthChange={setMonth}
                disabled={calendarDisabled || bookedDates}
                showOutsideDays={false}
                modifiers={{
                  booked: bookedDates,
                }}
                modifiersClassNames={{
                  booked: "[&>button]:line-through opacity-70",
                }}
                className="bg-transparent p-0 [--cell-size:--spacing(10)]"
                formatters={{
                  formatWeekdayName: (date) =>
                    date.toLocaleString("en-US", { weekday: "short" }),
                }}
              />
            )}
          </div>

          {/* Presets List (Matches Image 2 exactly) */}
          {showPresets && (
            <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
              {/* Row 1: Today, Yesterday, Tomorrow */}
              <div className="flex flex-wrap gap-2">
                {PRESETS_ROW_1.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant={isPresetActive(preset) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetClick(preset)}
                    className="shadow-none"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Row 2: Last 7 days, Next 7 days */}
              <div className="flex flex-wrap gap-2">
                {PRESETS_ROW_2.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant={isPresetActive(preset) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetClick(preset)}
                    className="shadow-none"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Row 3: Last 30 days, Month to date */}
              <div className="flex flex-wrap gap-2">
                {PRESETS_ROW_3.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant={isPresetActive(preset) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetClick(preset)}
                    className="shadow-none"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Row 4: Last month, Next month */}
              <div className="flex flex-wrap gap-2">
                {PRESETS_ROW_4.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant={isPresetActive(preset) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetClick(preset)}
                    className="shadow-none"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Row 5: Year to date, Last year */}
              <div className="flex flex-wrap gap-2">
                {PRESETS_ROW_5.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant={isPresetActive(preset) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetClick(preset)}
                    className="shadow-none"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Time Slots & Optional Duration */}
        {showTimePicker && (
          <div className="flex w-full flex-col border-t border-border max-md:h-72 md:w-52 md:border-t-0 md:border-l">
            {/* Optional Duration Toggle (defaults to Single time) */}
            {showDuration && (
              <div className="flex items-center justify-between border-b border-border/80 px-4 py-2.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Duration
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant={selectedDuration === null ? "default" : "outline"}
                    size="xs"
                    onClick={() => handleDurationSelect(null)}
                    className="h-6 px-1.5 text-[11px]"
                  >
                    Single
                  </Button>
                  {durations.map((dur) => (
                    <Button
                      key={dur}
                      type="button"
                      variant={selectedDuration === dur ? "default" : "outline"}
                      size="xs"
                      onClick={() => handleDurationSelect(dur)}
                      className="h-6 px-1.5 text-[11px]"
                    >
                      {dur}m
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Scrollable list of 15m time slots */}
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-2 p-6">
                {timeSlots.map((time) => {
                  const isSelected = selectedTime === time
                  const isBooked = bookedTimes.includes(time)

                  return (
                    <Button
                      key={time}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      disabled={isBooked}
                      onClick={() => handleTimeSelect(time)}
                      className={cn(
                        "w-full shadow-none tabular-nums",
                        isBooked && "line-through opacity-40 hover:bg-transparent"
                      )}
                    >
                      {time}
                    </Button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>

      {/* ================================================================== */}
      {/* Card Footer: Selection Feedback & Continue Button */}
      {/* ================================================================== */}
      <CardFooter className="flex flex-col gap-4 border-t px-6 py-4 md:flex-row md:items-center">
        <div className="flex items-center gap-2 text-sm">
          {(mode === "single" ? selectedDate : selectedRange?.from) && selectedTime ? (
            <>
              <CircleCheckIcon className="size-5 shrink-0 stroke-green-600 dark:stroke-green-400" />
              <span>
                Your meeting is booked for{" "}
                <span className="font-medium text-foreground">
                  {mode === "single" && selectedDate ? (
                    selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                  ) : selectedRange?.from ? (
                    selectedRange.to ? (
                      `${selectedRange.from.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })} – ${selectedRange.to.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}`
                    ) : (
                      selectedRange.from.toLocaleDateString("en-US", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })
                    )
                  ) : null}
                </span>{" "}
                at{" "}
                <span className="font-medium text-foreground">
                  {selectedTime}
                  {calculatedEndTime ? ` – ${calculatedEndTime} (${selectedDuration} min)` : ""}
                </span>
                .
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">
              Select a {mode === "single" ? "date" : "date range"} and time for your meeting.
            </span>
          )}
        </div>

        <Button
          type="button"
          disabled={!canContinue}
          onClick={handleConfirm}
          className="w-full md:ml-auto md:w-auto"
          variant="outline"
        >
          {confirmLabel}
        </Button>
      </CardFooter>
    </Card>
  )
}

// ============================================================================
// Demos
// ============================================================================

/**
 * CalendarAppointmentBookingDemo: Drop-in replacement for the user's snippet 2
 */
export const CalendarAppointmentBookingDemo = () => {
  const bookedDates = Array.from({ length: 3 }, (_, i) => new Date(2025, 5, 17 + i))

  return (
    <div>
      <DateTimePicker
        title="Book your appointment"
        defaultValue={{
          date: new Date(2025, 5, 20),
          time: "10:00",
        }}
        bookedDates={bookedDates}
        showDuration={true}
        showPresets={true}
      />
      <p className="text-muted-foreground mt-4 text-center text-xs" role="region">
        Appointment calendar
      </p>
    </div>
  )
}

export { DatePickerWithRangePresets } from "@/components/ui/date-picker-with-range-presets"

/**
 * CalendarWithRangePresetsDemo: Drop-in replacement for the user's snippet 1
 */
export { CalendarWithRangePresetsDemo } from "@/components/ui/date-picker-with-range-presets"

/**
 * Complete interactive showcase demo
 */
export const DateTimePickerDemo = () => {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center p-4">
      <DateTimePicker />
    </div>
  )
}

export default DateTimePicker
