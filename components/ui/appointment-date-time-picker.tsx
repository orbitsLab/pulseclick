"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock, Check, X } from "lucide-react"
import type { Matcher } from "react-day-picker"

import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ============================================================================
// Types & Defaults
// ============================================================================

export interface TimeSlotItem {
  time: string
  available: boolean
}

export const DEFAULT_TIME_SLOTS: TimeSlotItem[] = [
  { available: false, time: "09:00" },
  { available: false, time: "09:30" },
  { available: true, time: "10:00" },
  { available: true, time: "10:30" },
  { available: true, time: "11:00" },
  { available: true, time: "11:30" },
  { available: false, time: "12:00" },
  { available: true, time: "12:30" },
  { available: true, time: "13:00" },
  { available: true, time: "13:30" },
  { available: true, time: "14:00" },
  { available: false, time: "14:30" },
  { available: false, time: "15:00" },
  { available: true, time: "15:30" },
  { available: true, time: "16:00" },
  { available: true, time: "16:30" },
  { available: true, time: "17:00" },
  { available: true, time: "17:30" },
]

export interface AppointmentPickerInlineProps {
  /** Currently selected date */
  date?: Date
  /** Currently selected time slot */
  time?: string | null
  /** Default date (uncontrolled) */
  defaultDate?: Date
  /** Default time (uncontrolled) */
  defaultTime?: string | null
  /** Callback fired when date or time slot is chosen */
  onSelect?: (date: Date, time: string | null) => void
  /** Custom time slots */
  timeSlots?: TimeSlotItem[]
  /** Custom disabled matcher for calendar */
  disabledDates?: Matcher | Matcher[]
  /** Whether to show the DayPicker footer link */
  showFooterLink?: boolean
  /** Confirm action callback */
  onConfirm?: (date: Date, time: string) => void
  /** Cancel/reset action callback */
  onCancel?: () => void
  className?: string
}

export interface AppointmentDateTimePickerProps {
  /** Currently selected date (controlled) */
  date?: Date
  /** Currently selected time (controlled) */
  time?: string | null
  /** Default date (uncontrolled) */
  defaultDate?: Date
  /** Default time (uncontrolled) */
  defaultTime?: string | null
  /** Callback fired on selection change */
  onSelect?: (date: Date, time: string | null) => void
  /** Callback fired on confirmation */
  onConfirm?: (date: Date, time: string) => void
  /** Time slots available to select */
  timeSlots?: TimeSlotItem[]
  /** Tooltip text shown on hover */
  tooltipText?: string
  /** Placeholder text on trigger button when no selection */
  placeholder?: string
  /** Whether to auto-close popover when time is clicked. Default: false */
  closeOnTimeSelect?: boolean
  /** Trigger button additional classes */
  triggerClassName?: string
  /** Container additional classes */
  className?: string
}

// ============================================================================
// 1. Inline Component (Raw Picker)
// ============================================================================

export function AppointmentDateTimePickerInline({
  date: controlledDate,
  time: controlledTime,
  defaultDate,
  defaultTime,
  onSelect,
  onConfirm,
  onCancel,
  timeSlots = DEFAULT_TIME_SLOTS,
  disabledDates,
  showFooterLink = false,
  className,
}: AppointmentPickerInlineProps) {
  const today = React.useMemo(() => new Date(), [])

  // Controlled vs uncontrolled state
  const [internalDate, setInternalDate] = React.useState<Date>(
    defaultDate ?? today
  )
  const date = controlledDate !== undefined ? controlledDate : internalDate

  const [internalTime, setInternalTime] = React.useState<string | null>(
    defaultTime ?? null
  )
  const time = controlledTime !== undefined ? controlledTime : internalTime

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setInternalDate(newDate)
      setInternalTime(null)
      onSelect?.(newDate, null)
    }
  }

  const handleTimeSelect = (slotTime: string) => {
    setInternalTime(slotTime)
    onSelect?.(date, slotTime)
  }

  const calendarDisabled = React.useMemo<Matcher | Matcher[]>(() => {
    if (disabledDates) return disabledDates
    return [{ before: today }]
  }, [disabledDates, today])

  return (
    <div className={cn("w-fit", className)}>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex max-sm:flex-col">
          {/* Left: Single Date Calendar */}
          <div className="p-3 sm:pe-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={calendarDisabled}
              className="bg-transparent p-0 [--cell-size:--spacing(9)] sm:[--cell-size:--spacing(10)]"
              formatters={{
                formatWeekdayName: (dayDate) =>
                  dayDate.toLocaleString("en-US", { weekday: "short" }),
              }}
            />
          </div>

          {/* Right: Scrollable Time Slots Column */}
          <div className="relative w-full max-sm:h-56 sm:w-44 border-t border-border sm:border-t-0 sm:border-l">
            <div className="absolute inset-0 py-3">
              <ScrollArea className="h-full">
                <div className="space-y-3 px-3">
                  {/* Formatted Date Header */}
                  <div className="flex h-6 shrink-0 items-center justify-between border-b border-border/60 pb-2">
                    <p className="font-semibold text-xs text-foreground">
                      {format(date, "EEEE, d")}
                    </p>
                    {time && (
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {time}
                      </span>
                    )}
                  </div>

                  {/* Grid of Time Slot Buttons */}
                  <div className="grid gap-1.5 max-sm:grid-cols-2">
                    {timeSlots.map(({ time: timeSlot, available }) => {
                      const isSelected = time === timeSlot

                      return (
                        <Button
                          key={timeSlot}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          disabled={!available}
                          onClick={() => handleTimeSelect(timeSlot)}
                          className={cn(
                            "w-full h-8 justify-center text-xs font-mono font-medium shadow-none transition-all",
                            isSelected && "bg-primary text-primary-foreground font-semibold",
                            !available && "line-through opacity-30 cursor-not-allowed hover:bg-transparent"
                          )}
                        >
                          {timeSlot}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Action bar if onConfirm or onCancel provided */}
        {(onConfirm || onCancel) && (
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2.5">
            <span className="text-xs text-muted-foreground">
              {time ? `${format(date, "MMM d")} at ${time}` : "Select a time"}
            </span>
            <div className="flex items-center gap-1.5">
              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={onCancel}
                  className="h-7 text-xs"
                >
                  <X className="size-3 mr-1" />
                  Cancel
                </Button>
              )}
              {onConfirm && (
                <Button
                  type="button"
                  size="xs"
                  disabled={!time}
                  onClick={() => time && onConfirm(date, time)}
                  className="h-7 text-xs font-medium"
                >
                  <Check className="size-3 mr-1" />
                  Done
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {showFooterLink && (
        <p
          aria-live="polite"
          className="mt-3 text-center text-xs text-muted-foreground"
          role="region"
        >
          Appointment picker -{" "}
          <a
            className="underline hover:text-foreground"
            href="https://daypicker.dev/"
            rel="noreferrer noopener nofollow"
            target="_blank"
          >
            React DayPicker
          </a>
        </p>
      )}
    </div>
  )
}

// ============================================================================
// 2. Popover Component (Revealed on Tooltip / Trigger Click)
// ============================================================================

export function AppointmentDateTimePicker({
  date: controlledDate,
  time: controlledTime,
  defaultDate,
  defaultTime,
  onSelect,
  onConfirm,
  timeSlots = DEFAULT_TIME_SLOTS,
  tooltipText = "Click to schedule appointment",
  placeholder = "Pick a date and time",
  closeOnTimeSelect = false,
  triggerClassName,
  className,
}: AppointmentDateTimePickerProps) {
  const today = React.useMemo(() => new Date(), [])
  const [open, setOpen] = React.useState(false)

  // Internal selection states
  const [internalDate, setInternalDate] = React.useState<Date>(
    defaultDate ?? today
  )
  const date = controlledDate !== undefined ? controlledDate : internalDate

  const [internalTime, setInternalTime] = React.useState<string | null>(
    defaultTime ?? null
  )
  const time = controlledTime !== undefined ? controlledTime : internalTime

  const handleSelection = (newDate: Date, newTime: string | null) => {
    setInternalDate(newDate)
    setInternalTime(newTime)
    onSelect?.(newDate, newTime)

    if (closeOnTimeSelect && newTime) {
      setOpen(false)
      onConfirm?.(newDate, newTime)
    }
  }

  const handleDone = (confirmedDate: Date, confirmedTime: string) => {
    setOpen(false)
    onConfirm?.(confirmedDate, confirmedTime)
  }

  return (
    <div className={cn("inline-block", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-10 justify-start text-left font-normal gap-2.5 px-3.5 border-border bg-background hover:bg-muted/50 transition-colors shadow-xs",
                    !date && "text-muted-foreground",
                    triggerClassName
                  )}
                >
                  <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                  {date ? (
                    time ? (
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <span>{format(date, "EEE, MMM d, yyyy")}</span>
                        <span className="text-muted-foreground font-normal">at</span>
                        <span className="font-mono font-semibold text-primary">{time}</span>
                      </span>
                    ) : (
                      <span className="text-foreground">
                        {format(date, "EEE, MMM d, yyyy")}{" "}
                        <span className="text-xs text-muted-foreground">• Pick time</span>
                      </span>
                    )
                  ) : (
                    <span>{placeholder}</span>
                  )}
                  <Clock className="ml-auto size-3.5 text-muted-foreground/70" />
                </Button>
              </PopoverTrigger>

        {/* Popover content containing the Date & Time Picker */}
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-auto p-0 border-0 bg-transparent shadow-xl"
        >
          <AppointmentDateTimePickerInline
            date={date}
            time={time}
            timeSlots={timeSlots}
            onSelect={handleSelection}
            onConfirm={handleDone}
            onCancel={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ============================================================================
// Drop-in Demo matching user's exact snippet
// ============================================================================

export default function AppointmentPickerDemo() {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = React.useState<string | null>("10:00")

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6">
      {/* 1. Trigger with Tooltip on hover, opening on click */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Click button to open picker (hover shows tooltip):
        </span>
        <AppointmentDateTimePicker
          date={selectedDate}
          time={selectedTime}
          onSelect={(d, t) => {
            setSelectedDate(d)
            setSelectedTime(t)
          }}
          onConfirm={(d, t) => {
            console.log("Appointment confirmed:", d, t)
          }}
        />
      </div>

      {/* 2. Direct inline view for comparison */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Inline preview:
        </span>
        <AppointmentDateTimePickerInline
          date={selectedDate}
          time={selectedTime}
          onSelect={(d, t) => {
            setSelectedDate(d)
            setSelectedTime(t)
          }}
          showFooterLink={true}
        />
      </div>
    </div>
  )
}
