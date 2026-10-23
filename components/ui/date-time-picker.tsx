"use client"

import * as React from "react"
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfYear,
  format,
  isSameDay,
  nextSaturday,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns"
import type { DateRange, Matcher } from "react-day-picker"
import {
  Calendar as CalendarIcon,
  CalendarRange,
  Check,
  CircleCheck,
  Globe,
  RotateCcw,
  Sun,
  Sunset,
  Moon,
  ChevronRight,
} from "lucide-react"

import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

// ============================================================================
// Types
// ============================================================================

export type DateTimePickerMode = "single" | "range"
export type TimeFormat = "12h" | "24h"
export type TimeOfDayPeriod = "all" | "morning" | "afternoon" | "evening"
export type PresetCategory = "all" | "upcoming" | "past"

export interface DateTimePickerValue {
  date?: Date
  range?: DateRange
  time?: string // HH:mm format, e.g. "10:00"
  endTime?: string // HH:mm format, e.g. "10:45"
  duration?: number // in minutes, e.g. 45
  timezone?: string
}

export interface PresetItem {
  id: string
  label: string
  category: "upcoming" | "past"
  getSingle?: (today: Date) => Date
  getRange?: (today: Date) => DateRange
}

export interface DateTimePickerProps {
  /** Mode: 'single' for one date + time, 'range' for a date range + time */
  mode?: DateTimePickerMode
  /** Whether to show a toggle button in the header to switch between single and range */
  allowModeSwitch?: boolean

  /** Current controlled value */
  value?: DateTimePickerValue
  /** Initial default value */
  defaultValue?: DateTimePickerValue
  /** Callback fired whenever date, range, time, or duration changes */
  onChange?: (value: DateTimePickerValue) => void
  /** Callback fired when user clicks the Confirm / Continue button */
  onConfirm?: (value: DateTimePickerValue) => void
  /** Callback fired when user clicks Reset */
  onReset?: () => void

  // Calendar restrictions
  /** List of booked dates that should show booked styling */
  bookedDates?: Date[]
  /** Dates that cannot be selected */
  disabledDates?: Date[] | ((date: Date) => boolean)
  /** Minimum selectable date */
  minDate?: Date
  /** Maximum selectable date */
  maxDate?: Date

  // Time slots configuration
  /** Whether to show the time slots column (defaults to true) */
  showTimePicker?: boolean
  /** Interval in minutes between generated slots (e.g. 15, 30, 60). Default 15 */
  timeInterval?: number
  /** Starting hour for time slots (0-23). Default 9 (9 AM) */
  startHour?: number
  /** Ending hour for time slots (0-23). Default 18 (6 PM) */
  endHour?: number
  /** Unavailable / booked time slots for the selected date, e.g. ["10:15", "14:00"] */
  bookedTimes?: string[]
  /** 12-hour or 24-hour time display */
  timeFormat?: TimeFormat
  /** Allow user to toggle between 12h and 24h format */
  allowTimeFormatToggle?: boolean

  // Duration configuration
  /** Whether to show duration options (e.g. 15m, 30m, 45m, 60m). Default true */
  showDurationPicker?: boolean
  /** List of available durations in minutes */
  durations?: number[]
  /** Default duration in minutes. Default 30 */
  defaultDuration?: number

  // Presets
  /** Whether to show the presets panel. Default true */
  showPresets?: boolean
  /** Filter preset category: 'all' | 'upcoming' | 'past'. Default 'all' */
  presetCategory?: PresetCategory
  /** Custom presets list to override defaults */
  customPresets?: PresetItem[]

  // Header & Context
  title?: string
  description?: string
  showTimezone?: boolean
  timezone?: string
  confirmLabel?: string

  className?: string
}

// ============================================================================
// Default Presets
// ============================================================================

const DEFAULT_PRESETS: PresetItem[] = [
  // Upcoming presets
  {
    id: "today",
    label: "Today",
    category: "upcoming",
    getSingle: (today) => today,
    getRange: (today) => ({ from: today, to: today }),
  },
  {
    id: "tomorrow",
    label: "Tomorrow",
    category: "upcoming",
    getSingle: (today) => addDays(today, 1),
    getRange: (today) => ({ from: today, to: addDays(today, 1) }),
  },
  {
    id: "this-weekend",
    label: "This weekend",
    category: "upcoming",
    getSingle: (today) => nextSaturday(today),
    getRange: (today) => {
      const sat = nextSaturday(today)
      return { from: sat, to: addDays(sat, 1) }
    },
  },
  {
    id: "next-7-days",
    label: "Next 7 days",
    category: "upcoming",
    getSingle: (today) => addDays(today, 7),
    getRange: (today) => ({ from: today, to: addDays(today, 6) }),
  },
  {
    id: "next-14-days",
    label: "Next 14 days",
    category: "upcoming",
    getSingle: (today) => addDays(today, 14),
    getRange: (today) => ({ from: today, to: addDays(today, 13) }),
  },
  {
    id: "next-30-days",
    label: "Next 30 days",
    category: "upcoming",
    getSingle: (today) => addDays(today, 30),
    getRange: (today) => ({ from: today, to: addDays(today, 29) }),
  },
  {
    id: "this-month",
    label: "This month",
    category: "upcoming",
    getSingle: (today) => endOfMonth(today),
    getRange: (today) => ({ from: startOfMonth(today), to: endOfMonth(today) }),
  },
  {
    id: "next-month",
    label: "Next month",
    category: "upcoming",
    getSingle: (today) => startOfMonth(addMonths(today, 1)),
    getRange: (today) => ({
      from: startOfMonth(addMonths(today, 1)),
      to: endOfMonth(addMonths(today, 1)),
    }),
  },
  // Past presets
  {
    id: "yesterday",
    label: "Yesterday",
    category: "past",
    getSingle: (today) => subDays(today, 1),
    getRange: (today) => ({ from: subDays(today, 1), to: subDays(today, 1) }),
  },
  {
    id: "last-7-days",
    label: "Last 7 days",
    category: "past",
    getSingle: (today) => subDays(today, 7),
    getRange: (today) => ({ from: subDays(today, 6), to: today }),
  },
  {
    id: "last-30-days",
    label: "Last 30 days",
    category: "past",
    getSingle: (today) => subDays(today, 30),
    getRange: (today) => ({ from: subDays(today, 29), to: today }),
  },
  {
    id: "month-to-date",
    label: "Month to date",
    category: "past",
    getSingle: (today) => startOfMonth(today),
    getRange: (today) => ({ from: startOfMonth(today), to: today }),
  },
  {
    id: "last-month",
    label: "Last month",
    category: "past",
    getSingle: (today) => startOfMonth(subMonths(today, 1)),
    getRange: (today) => ({
      from: startOfMonth(subMonths(today, 1)),
      to: endOfMonth(subMonths(today, 1)),
    }),
  },
  {
    id: "year-to-date",
    label: "Year to date",
    category: "past",
    getSingle: (today) => startOfYear(today),
    getRange: (today) => ({ from: startOfYear(today), to: today }),
  },
  {
    id: "last-year",
    label: "Last year",
    category: "past",
    getSingle: (today) => startOfYear(subYears(today, 1)),
    getRange: (today) => ({
      from: startOfYear(subYears(today, 1)),
      to: endOfYear(subYears(today, 1)),
    }),
  },
]

// ============================================================================
// Helper Functions
// ============================================================================

/** Formats a 24-hour "HH:mm" time string into 12h or 24h formatted string */
function formatTimeSlot(timeStr: string, timeFormat: TimeFormat): string {
  const [hStr, mStr] = timeStr.split(":")
  const hour = parseInt(hStr, 10)
  const minute = parseInt(mStr, 10)

  if (timeFormat === "24h") {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
  }

  const period = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`
}

/** Computes end time string ("HH:mm") given a start time and duration in minutes */
function computeEndTime(startTimeStr: string, durationMinutes: number): string {
  const [hStr, mStr] = startTimeStr.split(":")
  const totalMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + durationMinutes
  const endHour = Math.floor(totalMinutes / 60) % 24
  const endMinute = totalMinutes % 60
  return `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`
}

/** Generates slots array based on startHour, endHour, and interval */
function generateTimeSlots(startHour: number, endHour: number, intervalMinutes: number): string[] {
  const slots: string[] = []
  const totalMinutesStart = startHour * 60
  const totalMinutesEnd = endHour * 60

  for (let mins = totalMinutesStart; mins <= totalMinutesEnd; mins += intervalMinutes) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
  }

  return slots
}

// ============================================================================
// Main DateTimePicker Component
// ============================================================================

export function DateTimePicker({
  mode: initialMode = "single",
  allowModeSwitch = true,
  value,
  defaultValue,
  onChange,
  onConfirm,
  onReset,
  bookedDates = [],
  disabledDates,
  minDate,
  maxDate,
  showTimePicker = true,
  timeInterval = 15,
  startHour = 9,
  endHour = 18,
  bookedTimes = [],
  timeFormat: initialTimeFormat = "12h",
  allowTimeFormatToggle = true,
  showDurationPicker = true,
  durations = [15, 30, 45, 60],
  defaultDuration = 30,
  showPresets = true,
  presetCategory = "all",
  customPresets,
  title,
  description,
  showTimezone = true,
  timezone: customTimezone,
  confirmLabel = "Continue",
  className,
}: DateTimePickerProps) {
  const today = React.useMemo(() => new Date(), [])

  // Mode state
  const [currentMode, setCurrentMode] = React.useState<DateTimePickerMode>(initialMode)

  // Time format state (12h vs 24h)
  const [timeFormat, setTimeFormat] = React.useState<TimeFormat>(initialTimeFormat)

  // Controlled vs uncontrolled state
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(
    defaultValue?.date ?? (initialMode === "single" ? today : undefined)
  )
  const selectedDate = value?.date !== undefined ? value.date : internalDate

  const [internalRange, setInternalRange] = React.useState<DateRange | undefined>(
    defaultValue?.range ??
      (initialMode === "range"
        ? { from: today, to: addDays(today, 6) }
        : undefined)
  )
  const selectedRange = value?.range !== undefined ? value.range : internalRange

  // Month navigation state
  const [month, setMonth] = React.useState<Date>(
    defaultValue?.date || defaultValue?.range?.from || today
  )

  // Time & duration states
  const [internalTime, setInternalTime] = React.useState<string | null>(
    defaultValue?.time ?? "10:00"
  )
  const selectedTime = value?.time !== undefined ? value.time : internalTime

  const [internalDuration, setInternalDuration] = React.useState<number>(
    defaultValue?.duration ?? defaultDuration
  )
  const duration = value?.duration !== undefined ? value.duration : internalDuration

  // Filter time slots by period of day
  const [periodFilter, setPeriodFilter] = React.useState<TimeOfDayPeriod>("all")

  // Filter preset categories
  const [selectedPresetTab, setSelectedPresetTab] =
    React.useState<PresetCategory>(presetCategory)

  // Timezone detection
  const detectedTimezone = React.useMemo(() => {
    if (customTimezone) return customTimezone
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      return "Local Time"
    }
  }, [customTimezone])

  // Computed end time
  const calculatedEndTime = React.useMemo(() => {
    if (!selectedTime || !duration) return null
    return computeEndTime(selectedTime, duration)
  }, [selectedTime, duration])

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

  // Time slots list
  const allTimeSlots = React.useMemo(() => {
    return generateTimeSlots(startHour, endHour, timeInterval)
  }, [startHour, endHour, timeInterval])

  // Filtered time slots based on period (morning / afternoon / evening)
  const filteredTimeSlots = React.useMemo(() => {
    if (periodFilter === "all") return allTimeSlots
    return allTimeSlots.filter((slot) => {
      const hour = parseInt(slot.split(":")[0], 10)
      if (periodFilter === "morning") return hour < 12
      if (periodFilter === "afternoon") return hour >= 12 && hour < 17
      if (periodFilter === "evening") return hour >= 17
      return true
    })
  }, [allTimeSlots, periodFilter])

  // Presets list
  const activePresets = React.useMemo(() => {
    const list = customPresets || DEFAULT_PRESETS
    if (selectedPresetTab === "all") return list
    return list.filter((p) => p.category === selectedPresetTab)
  }, [customPresets, selectedPresetTab])

  // Emit change
  const notifyChange = React.useCallback(
    (updates: Partial<DateTimePickerValue>) => {
      const nextValue: DateTimePickerValue = {
        date: currentMode === "single" ? (updates.date ?? selectedDate) : undefined,
        range: currentMode === "range" ? (updates.range ?? selectedRange) : undefined,
        time: updates.time !== undefined ? updates.time : (selectedTime ?? undefined),
        endTime: updates.endTime !== undefined ? updates.endTime : (calculatedEndTime ?? undefined),
        duration: updates.duration !== undefined ? updates.duration : duration,
        timezone: detectedTimezone,
      }
      onChange?.(nextValue)
    },
    [currentMode, selectedDate, selectedRange, selectedTime, calculatedEndTime, duration, detectedTimezone, onChange]
  )

  // Handle preset click
  const handlePresetSelect = (preset: PresetItem) => {
    if (currentMode === "single" && preset.getSingle) {
      const newDate = preset.getSingle(today)
      setInternalDate(newDate)
      setMonth(newDate)
      notifyChange({ date: newDate })
    } else if (currentMode === "range" && preset.getRange) {
      const newRange = preset.getRange(today)
      setInternalRange(newRange)
      if (newRange.from) setMonth(newRange.from)
      notifyChange({ range: newRange })
    }
  }

  // Check if a preset is currently active
  const isPresetActive = (preset: PresetItem) => {
    if (currentMode === "single" && preset.getSingle && selectedDate) {
      return isSameDay(preset.getSingle(today), selectedDate)
    }
    if (
      currentMode === "range" &&
      preset.getRange &&
      selectedRange?.from &&
      selectedRange?.to
    ) {
      const pRange = preset.getRange(today)
      return (
        pRange.from &&
        pRange.to &&
        isSameDay(pRange.from, selectedRange.from) &&
        isSameDay(pRange.to, selectedRange.to)
      )
    }
    return false
  }

  // Handle single date select
  const handleSingleSelect = (date: Date | undefined) => {
    setInternalDate(date)
    if (date) setMonth(date)
    notifyChange({ date })
  }

  // Handle range select
  const handleRangeSelect = (range: DateRange | undefined) => {
    setInternalRange(range)
    if (range?.from) setMonth(range.from)
    notifyChange({ range })
  }

  // Handle time select
  const handleTimeSelect = (timeSlot: string) => {
    setInternalTime(timeSlot)
    const end = computeEndTime(timeSlot, duration)
    notifyChange({ time: timeSlot, endTime: end })
  }

  // Handle duration select
  const handleDurationSelect = (dur: number) => {
    setInternalDuration(dur)
    if (selectedTime) {
      const end = computeEndTime(selectedTime, dur)
      notifyChange({ duration: dur, endTime: end })
    } else {
      notifyChange({ duration: dur })
    }
  }

  // Handle reset
  const handleReset = () => {
    setInternalDate(undefined)
    setInternalRange(undefined)
    setInternalTime(null)
    onReset?.()
  }

  // Handle confirmation
  const handleConfirm = () => {
    onConfirm?.({
      date: currentMode === "single" ? selectedDate : undefined,
      range: currentMode === "range" ? selectedRange : undefined,
      time: selectedTime ?? undefined,
      endTime: calculatedEndTime ?? undefined,
      duration,
      timezone: detectedTimezone,
    })
  }

  // Determine readiness for confirm
  const isReadyToConfirm =
    currentMode === "single"
      ? Boolean(selectedDate && (!showTimePicker || selectedTime))
      : Boolean(selectedRange?.from && (!showTimePicker || selectedTime))

  return (
    <Card className={cn("overflow-hidden border-border bg-card p-0 shadow-sm", className)}>
      {/* ================================================================== */}
      {/* Card Header */}
      {/* ================================================================== */}
      <CardHeader className="flex flex-col gap-2 border-b border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="font-heading text-lg font-semibold tracking-tight text-foreground">
            {title || (currentMode === "single" ? "Schedule appointment" : "Select date range & time")}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {description ||
              (currentMode === "single"
                ? "Choose a preferred date, time slot, and meeting length."
                : "Select start and end dates with an optional time block.")}
          </CardDescription>
        </div>

        {/* Header Right Tools: Mode Switcher, 12h/24h toggle, Timezone */}
        <div className="flex flex-wrap items-center gap-2">
          {allowModeSwitch && (
            <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
              <Button
                variant={currentMode === "single" ? "default" : "ghost"}
                size="xs"
                onClick={() => setCurrentMode("single")}
                className="gap-1.5 px-2.5 text-xs font-medium"
              >
                <CalendarIcon className="size-3.5" />
                Single
              </Button>
              <Button
                variant={currentMode === "range" ? "default" : "ghost"}
                size="xs"
                onClick={() => setCurrentMode("range")}
                className="gap-1.5 px-2.5 text-xs font-medium"
              >
                <CalendarRange className="size-3.5" />
                Range
              </Button>
            </div>
          )}

          {showTimePicker && allowTimeFormatToggle && (
            <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
              <Button
                variant={timeFormat === "12h" ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setTimeFormat("12h")}
                className="px-2 text-xs"
              >
                12h
              </Button>
              <Button
                variant={timeFormat === "24h" ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setTimeFormat("24h")}
                className="px-2 text-xs"
              >
                24h
              </Button>
            </div>
          )}

          {showTimezone && (
            <Badge
              variant="outline"
              className="hidden items-center gap-1 bg-background/50 px-2 py-1 text-[11px] font-normal text-muted-foreground sm:inline-flex"
            >
              <Globe className="size-3 text-muted-foreground/80" />
              <span className="max-w-[130px] truncate">{detectedTimezone}</span>
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* ================================================================== */}
      {/* Card Content Layout: [Presets] | [Calendar] | [Time Slots] */}
      {/* ================================================================== */}
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* -------------------------------------------------------------- */}
          {/* Panel 1: Presets Column */}
          {/* -------------------------------------------------------------- */}
          {showPresets && (
            <div className="flex flex-col border-b border-border bg-muted/15 lg:w-44 lg:shrink-0 lg:border-r lg:border-b-0">
              {/* Presets Category Filter */}
              <div className="flex items-center justify-between border-b border-border/80 px-3 py-2.5">
                <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                  Presets
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedPresetTab("upcoming")}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                      selectedPresetTab === "upcoming"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPresetTab("past")}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                      selectedPresetTab === "past"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Past
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPresetTab("all")}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                      selectedPresetTab === "all"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    All
                  </button>
                </div>
              </div>

              {/* Presets List */}
              <div className="flex max-h-48 flex-row gap-1.5 overflow-x-auto p-2.5 lg:max-h-[380px] lg:flex-col lg:overflow-y-auto">
                {activePresets.map((preset) => {
                  const active = isPresetActive(preset)
                  return (
                    <Button
                      key={preset.id}
                      variant={active ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handlePresetSelect(preset)}
                      className={cn(
                        "h-8 justify-start rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors",
                        active
                          ? "bg-primary text-primary-foreground shadow-none"
                          : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                      )}
                    >
                      {preset.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------- */}
          {/* Panel 2: Interactive Calendar */}
          {/* -------------------------------------------------------------- */}
          <div className="flex flex-1 items-center justify-center p-4 sm:p-5">
            {currentMode === "single" ? (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleSingleSelect}
                month={month}
                onMonthChange={setMonth}
                disabled={calendarDisabled}
                modifiers={{
                  booked: bookedDates,
                }}
                modifiersClassNames={{
                  booked: "[&>button]:line-through opacity-70",
                }}
                showOutsideDays={false}
                className="w-full max-w-sm bg-transparent p-0 [--cell-size:--spacing(9)] sm:[--cell-size:--spacing(10)]"
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
                disabled={calendarDisabled}
                modifiers={{
                  booked: bookedDates,
                }}
                modifiersClassNames={{
                  booked: "[&>button]:line-through opacity-70",
                }}
                showOutsideDays={false}
                className="w-full max-w-sm bg-transparent p-0 [--cell-size:--spacing(9)] sm:[--cell-size:--spacing(10)]"
                formatters={{
                  formatWeekdayName: (date) =>
                    date.toLocaleString("en-US", { weekday: "short" }),
                }}
              />
            )}
          </div>

          {/* -------------------------------------------------------------- */}
          {/* Panel 3: Time Slots & Duration (if showTimePicker is true) */}
          {/* -------------------------------------------------------------- */}
          {showTimePicker && (
            <div className="flex flex-col border-t border-border bg-card lg:w-56 lg:shrink-0 lg:border-t-0 lg:border-l">
              {/* Duration Selector Header */}
              {showDurationPicker && (
                <div className="border-b border-border/80 px-3 py-2.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                      Duration
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {duration} min
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {durations.map((dur) => (
                      <Button
                        key={dur}
                        variant={duration === dur ? "default" : "outline"}
                        size="xs"
                        onClick={() => handleDurationSelect(dur)}
                        className="h-6 text-[11px]"
                      >
                        {dur}m
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Period Filter Tabs */}
              <div className="flex items-center justify-between border-b border-border/80 bg-muted/20 px-2 py-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Time slots</span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setPeriodFilter("all")}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                      periodFilter === "all"
                        ? "bg-secondary text-secondary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                    title="All slots"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodFilter("morning")}
                    className={cn(
                      "flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                      periodFilter === "morning"
                        ? "bg-secondary text-secondary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                    title="Morning (before 12 PM)"
                  >
                    <Sun className="size-2.5" /> AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodFilter("afternoon")}
                    className={cn(
                      "flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                      periodFilter === "afternoon"
                        ? "bg-secondary text-secondary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                    title="Afternoon (12 PM - 5 PM)"
                  >
                    <Sunset className="size-2.5" /> PM
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodFilter("evening")}
                    className={cn(
                      "flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                      periodFilter === "evening"
                        ? "bg-secondary text-secondary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                    title="Evening (after 5 PM)"
                  >
                    <Moon className="size-2.5" /> Eve
                  </button>
                </div>
              </div>

              {/* Scrollable List of Time Slots */}
              <ScrollArea className="h-64 lg:h-[310px]">
                <div className="flex flex-col gap-1.5 p-3">
                  {filteredTimeSlots.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No slots available for this period.
                    </div>
                  ) : (
                    filteredTimeSlots.map((timeSlot) => {
                      const isSelected = selectedTime === timeSlot
                      const isBooked = bookedTimes.includes(timeSlot)
                      const displayTime = formatTimeSlot(timeSlot, timeFormat)

                      return (
                        <Button
                          key={timeSlot}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          disabled={isBooked}
                          onClick={() => handleTimeSelect(timeSlot)}
                          className={cn(
                            "w-full justify-between text-xs font-medium tabular-nums shadow-none transition-all",
                            isSelected && "bg-primary text-primary-foreground font-semibold",
                            isBooked && "line-through opacity-40 hover:bg-transparent"
                          )}
                        >
                          <span>{displayTime}</span>
                          {isBooked ? (
                            <span className="text-[10px] text-muted-foreground no-underline">
                              Booked
                            </span>
                          ) : isSelected ? (
                            <Check className="size-3.5 text-primary-foreground" />
                          ) : null}
                        </Button>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>

      {/* ================================================================== */}
      {/* Card Footer: Summary & Actions */}
      {/* ================================================================== */}
      <CardFooter className="flex flex-col gap-3.5 border-t border-border bg-card px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Selection Status Summary */}
        <div className="flex items-start gap-2.5 text-sm">
          {isReadyToConfirm ? (
            <>
              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
                <CircleCheck className="size-3.5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  {currentMode === "single" && selectedDate ? (
                    format(selectedDate, "EEEE, MMMM d, yyyy")
                  ) : currentMode === "range" && selectedRange?.from ? (
                    selectedRange.to ? (
                      `${format(selectedRange.from, "MMM d, yyyy")} – ${format(
                        selectedRange.to,
                        "MMM d, yyyy"
                      )}`
                    ) : (
                      `${format(selectedRange.from, "MMM d, yyyy")} (Select end date)`
                    )
                  ) : null}
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {selectedTime ? (
                    <>
                      {formatTimeSlot(selectedTime, timeFormat)}
                      {calculatedEndTime && ` – ${formatTimeSlot(calculatedEndTime, timeFormat)}`}
                      {duration && ` (${duration} min)`}
                    </>
                  ) : (
                    "No time slot chosen"
                  )}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarIcon className="size-4 shrink-0 text-muted-foreground/70" />
              <span>
                {currentMode === "single"
                  ? !selectedDate
                    ? "Select a date to view available times."
                    : "Select a time slot to continue."
                  : !selectedRange?.from
                  ? "Select a start and end date."
                  : "Select a time slot or continue."}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex w-full items-center gap-2 sm:w-auto">
          {(selectedDate || selectedRange?.from || selectedTime) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3" />
              Reset
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            disabled={!isReadyToConfirm}
            onClick={handleConfirm}
            className="w-full gap-1.5 px-4 text-xs font-semibold sm:w-auto"
          >
            <span>{confirmLabel}</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

// ============================================================================
// Demos for Drop-in Compatibility
// ============================================================================

/**
 * CalendarWithRangePresetsDemo: Drop-in enhanced replacement for the user's snippet 1
 */
export const CalendarWithRangePresetsDemo = () => {
  const today = React.useMemo(() => new Date(), [])
  const initialRange = React.useMemo<DateRange>(
    () => ({
      from: subDays(today, 6),
      to: today,
    }),
    [today]
  )

  return (
    <div className="w-full max-w-2xl py-4">
      <DateTimePicker
        mode="range"
        defaultValue={{ range: initialRange }}
        showTimePicker={false}
        title="Range calendar with presets"
        description="Select date intervals using quick presets or manual selection."
        confirmLabel="Apply range"
        onConfirm={(val) => {
          console.log("Range selected:", val.range)
        }}
      />
      <p className="mt-3 text-center text-xs text-muted-foreground" role="region">
        Range calendar with presets
      </p>
    </div>
  )
}

/**
 * CalendarAppointmentBookingDemo: Drop-in enhanced replacement for the user's snippet 2
 */
export const CalendarAppointmentBookingDemo = () => {
  const today = React.useMemo(() => new Date(), [])
  // Mock booked dates
  const bookedDates = React.useMemo(
    () => [addDays(today, 2), addDays(today, 3), addDays(today, 4)],
    [today]
  )
  // Mock booked times
  const bookedTimes = React.useMemo(() => ["10:15", "11:30", "14:00", "15:30"], [])

  return (
    <div className="w-full max-w-3xl py-4">
      <DateTimePicker
        mode="single"
        defaultValue={{
          date: today,
          time: "10:00",
          duration: 30,
        }}
        bookedDates={bookedDates}
        bookedTimes={bookedTimes}
        title="Book your appointment"
        description="Select an available date and time slot for your meeting."
        confirmLabel="Continue"
        onConfirm={(val) => {
          alert(
            `Appointment booked for ${val.date?.toDateString()} at ${val.time} for ${val.duration} min.`
          )
        }}
      />
      <p className="mt-3 text-center text-xs text-muted-foreground" role="region">
        Appointment calendar with presets & time picker
      </p>
    </div>
  )
}

/**
 * Full interactive showcase demo
 */
export const DateTimePickerDemo = () => {
  const today = React.useMemo(() => new Date(), [])
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center justify-center p-4">
      <DateTimePicker
        allowModeSwitch={true}
        showPresets={true}
        showTimePicker={true}
        showDurationPicker={true}
        bookedDates={[addDays(today, 2), addDays(today, 3)]}
        bookedTimes={["11:00", "14:15", "16:30"]}
      />
    </div>
  )
}

export default DateTimePicker
