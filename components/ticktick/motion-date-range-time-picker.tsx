"use client"

import * as React from "react"
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Check, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EASE_OUT, SPRING_PRESS } from "@/lib/ease"

// ============================================================================
// Types & Defaults
// ============================================================================

export interface DateRangeValue {
  from: string | null
  to: string | null
}

export interface MotionDateRangeTimePickerProps {
  /** Selected start/due date in "YYYY-MM-DD" format, or null */
  dueDate: string | null
  /** Optional selected end date in "YYYY-MM-DD" format, or null */
  endDate?: string | null
  /** Selected time in "HH:mm" format, or null */
  dueTime?: string | null
  /** Optional selected end time in "HH:mm" format, or null */
  endTime?: string | null
  /** Callback fired when date, range, or time is selected */
  onSelect: (
    dueDate: string | null,
    dueTime: string | null,
    endDate?: string | null,
    endTime?: string | null
  ) => void
  /** Callback fired when user closes or clicks Done */
  onClose?: () => void
  /** Container class name */
  className?: string
  /** Allow past dates selection (defaults to true) */
  allowPastDates?: boolean
  /** Default view mode */
  defaultMode?: "single" | "range"
}

export const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
]

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

// ============================================================================
// Date Utilities
// ============================================================================

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function parseISODate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function getDurationDays(fromStr: string | null | undefined, toStr: string | null | undefined): number | null {
  if (!fromStr || !toStr || fromStr === toStr) return null
  const from = parseISODate(fromStr)
  const to = parseISODate(toStr)
  if (!from || !to) return null
  const diffTime = Math.abs(to.getTime() - from.getTime())
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays
}

interface CalendarDay {
  date: Date
  iso: string
  dayNumber: number
  isOutside: boolean
  colIndex: number
}

function generateCalendarGrid(year: number, monthIndex: number): CalendarDay[][] {
  const firstDay = new Date(year, monthIndex, 1)
  const startDayOfWeek = firstDay.getDay() // 0 = Sunday
  const daysInCurrentMonth = new Date(year, monthIndex + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, monthIndex, 0).getDate()

  const weeks: CalendarDay[][] = []
  let currentWeek: CalendarDay[] = []

  // 1. Outside days before start of month
  for (let i = 0; i < startDayOfWeek; i++) {
    const dayNum = daysInPrevMonth - startDayOfWeek + 1 + i
    const d = new Date(year, monthIndex - 1, dayNum)
    currentWeek.push({
      date: d,
      iso: toISODate(d),
      dayNumber: dayNum,
      isOutside: true,
      colIndex: i,
    })
  }

  // 2. Days of current month
  for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
    const d = new Date(year, monthIndex, dayNum)
    const colIndex = currentWeek.length

    currentWeek.push({
      date: d,
      iso: toISODate(d),
      dayNumber: dayNum,
      isOutside: false,
      colIndex,
    })

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // 3. Outside days after end of month
  if (currentWeek.length > 0) {
    let nextMonthDay = 1
    while (currentWeek.length < 7) {
      const d = new Date(year, monthIndex + 1, nextMonthDay)
      currentWeek.push({
        date: d,
        iso: toISODate(d),
        dayNumber: nextMonthDay,
        isOutside: true,
        colIndex: currentWeek.length,
      })
      nextMonthDay++
    }
    weeks.push(currentWeek)
  }

  return weeks
}

// ============================================================================
// Component
// ============================================================================

export function MotionDateRangeTimePicker({
  dueDate,
  endDate,
  dueTime,
  endTime,
  onSelect,
  onClose,
  className,
  allowPastDates = true,
  defaultMode = "single",
}: MotionDateRangeTimePickerProps) {
  const today = React.useMemo(() => startOfDay(new Date()), [])
  const todayISO = React.useMemo(() => toISODate(today), [today])

  // Mode: "single" for 1 date, "range" for task duration (start + end date)
  const [mode, setMode] = React.useState<"single" | "range">(() => {
    if (endDate && endDate !== dueDate) return "range"
    return defaultMode
  })

  // Current viewed month & year
  const initialDate = React.useMemo(
    () => parseISODate(dueDate) || today,
    [dueDate, today]
  )
  const [viewDate, setViewDate] = React.useState<Date>(initialDate)
  const [slideDirection, setSlideDirection] = React.useState<number>(0)

  // Range in-progress picking state
  const [hoverISO, setHoverISO] = React.useState<string | null>(null)
  const [pickingRangeStart, setPickingRangeStart] = React.useState<string | null>(null)

  // Effective selected range
  const currentRange = React.useMemo<{ from: string | null; to: string | null }>(() => {
    if (pickingRangeStart && hoverISO) {
      const from = pickingRangeStart < hoverISO ? pickingRangeStart : hoverISO
      const to = pickingRangeStart < hoverISO ? hoverISO : pickingRangeStart
      return { from, to }
    }
    if (dueDate && endDate) {
      const from = dueDate < endDate ? dueDate : endDate
      const to = dueDate < endDate ? endDate : dueDate
      return { from, to }
    }
    if (dueDate) {
      return { from: dueDate, to: dueDate }
    }
    return { from: null, to: null }
  }, [dueDate, endDate, pickingRangeStart, hoverISO])

  // Month navigation
  const handlePrevMonth = () => {
    setSlideDirection(-1)
    setViewDate((prev) => addMonths(prev, -1))
  }

  const handleNextMonth = () => {
    setSlideDirection(1)
    setViewDate((prev) => addMonths(prev, 1))
  }

  // 8 Presets matching the reference image exactly
  const presets = React.useMemo(() => {
    const yesterday = subDays(today, 1)
    const last7 = subDays(today, 6)
    const last30 = subDays(today, 29)
    const startMonth = startOfMonth(today)
    const prevMonthDate = subMonths(today, 1)
    const startPrevMonth = startOfMonth(prevMonthDate)
    const endPrevMonth = endOfMonth(prevMonthDate)
    const startYear = startOfYear(today)
    const prevYearDate = subYears(today, 1)
    const startPrevYear = startOfYear(prevYearDate)
    const endPrevYear = endOfYear(prevYearDate)

    return [
      {
        id: "today",
        label: "Today",
        from: todayISO,
        to: todayISO,
        isSingle: true,
      },
      {
        id: "yesterday",
        label: "Yesterday",
        from: toISODate(yesterday),
        to: toISODate(yesterday),
        isSingle: true,
      },
      {
        id: "last7",
        label: "Last 7 days",
        from: toISODate(last7),
        to: todayISO,
        isSingle: false,
      },
      {
        id: "last30",
        label: "Last 30 days",
        from: toISODate(last30),
        to: todayISO,
        isSingle: false,
      },
      {
        id: "monthToDate",
        label: "Month to date",
        from: toISODate(startMonth),
        to: todayISO,
        isSingle: false,
      },
      {
        id: "lastMonth",
        label: "Last month",
        from: toISODate(startPrevMonth),
        to: toISODate(endPrevMonth),
        isSingle: false,
      },
      {
        id: "yearToDate",
        label: "Year to date",
        from: toISODate(startYear),
        to: todayISO,
        isSingle: false,
      },
      {
        id: "lastYear",
        label: "Last year",
        from: toISODate(startPrevYear),
        to: toISODate(endPrevYear),
        isSingle: false,
      },
    ]
  }, [today, todayISO])

  // Active preset match
  const activePresetId = React.useMemo(() => {
    if (!dueDate) return null
    for (const p of presets) {
      if (p.isSingle && dueDate === p.from && (!endDate || endDate === dueDate)) {
        return p.id
      }
      if (!p.isSingle && dueDate === p.from && endDate === p.to) {
        return p.id
      }
    }
    return null
  }, [dueDate, endDate, presets])

  // Mode Change
  const handleModeChange = (newMode: "single" | "range") => {
    setMode(newMode)
    if (newMode === "single") {
      setPickingRangeStart(null)
      setHoverISO(null)
      if (endDate) {
        onSelect(dueDate, dueTime ?? null, null, null)
      }
    } else {
      // Switched to range: if dueDate exists, prime it as range start
      if (dueDate) {
        setPickingRangeStart(dueDate)
      }
    }
  }

  // Click on a preset
  const handleSelectPreset = (p: (typeof presets)[0]) => {
    setPickingRangeStart(null)
    setHoverISO(null)
    const targetDate = parseISODate(p.from)
    if (targetDate) {
      setViewDate(targetDate)
    }

    if (p.isSingle) {
      setMode("single")
      onSelect(p.from, dueTime ?? null, null, null)
    } else {
      setMode("range")
      onSelect(p.from, dueTime ?? null, p.to, endTime ?? null)
    }
  }

  // Click on a day in calendar
  const handleDayClick = (day: CalendarDay) => {
    if (!allowPastDates && day.iso < todayISO) {
      return
    }

    // If day is from outside month, shift view
    if (day.isOutside) {
      setViewDate(day.date)
    }

    if (mode === "single") {
      // Single Date Mode: simple instant selection
      setPickingRangeStart(null)
      setHoverISO(null)
      onSelect(day.iso, dueTime ?? null, null, null)
    } else {
      // Range / Duration Mode: start date then end date
      if (!pickingRangeStart) {
        setPickingRangeStart(day.iso)
        onSelect(day.iso, dueTime ?? null, null, null)
      } else {
        if (day.iso === pickingRangeStart) {
          // Clicked same day: confirm single day duration
          setPickingRangeStart(null)
          setHoverISO(null)
          onSelect(day.iso, dueTime ?? null, null, null)
        } else {
          // Clicked different day: complete range
          const from = day.iso < pickingRangeStart ? day.iso : pickingRangeStart
          const to = day.iso < pickingRangeStart ? pickingRangeStart : day.iso
          setPickingRangeStart(null)
          setHoverISO(null)
          onSelect(from, dueTime ?? null, to, endTime ?? null)
        }
      }
    }
  }

  // Select time slot
  const handleTimeClick = (timeStr: string) => {
    const isAlreadySelected = dueTime === timeStr
    const nextTime = isAlreadySelected ? null : timeStr
    const effectiveDueDate = dueDate || todayISO

    onSelect(effectiveDueDate, nextTime, endDate ?? null, endTime ?? null)
  }

  // Clear all
  const handleClear = () => {
    setPickingRangeStart(null)
    setHoverISO(null)
    onSelect(null, null, null, null)
  }

  // Calendar weeks grid
  const calendarWeeks = React.useMemo(() => {
    return generateCalendarGrid(viewDate.getFullYear(), viewDate.getMonth())
  }, [viewDate])

  // Formatted header for right time panel
  const timeHeader = React.useMemo(() => {
    if (!dueDate) return "Time"
    const fromDate = parseISODate(dueDate)
    if (!fromDate) return "Time"

    if (endDate && endDate !== dueDate) {
      const toDate = parseISODate(endDate)
      if (toDate) {
        return `${format(fromDate, "MMM d")} – ${format(toDate, "MMM d")}`
      }
    }
    return format(fromDate, "EEEE, d")
  }, [dueDate, endDate])

  // Formatted summary for footer
  const summaryText = React.useMemo(() => {
    if (!dueDate) return "Select date"
    const fromDate = parseISODate(dueDate)
    if (!fromDate) return "Select date"

    let dateText = ""
    const durationDays = getDurationDays(dueDate, endDate)

    if (dueDate === todayISO && (!endDate || endDate === todayISO)) {
      dateText = "Today"
    } else if (endDate && endDate !== dueDate) {
      const toDate = parseISODate(endDate)
      const rangeStr = toDate
        ? `${format(fromDate, "MMM d")} – ${format(toDate, "MMM d")}`
        : format(fromDate, "MMM d")
      dateText = durationDays ? `${rangeStr} (${durationDays} days)` : rangeStr
    } else {
      dateText = format(fromDate, "EEE, MMM d")
    }

    if (dueTime) {
      return `${dateText} • ${dueTime}`
    }
    return dateText
  }, [dueDate, endDate, dueTime, todayISO])

  return (
    <div
      className={cn(
        "flex flex-col select-none overflow-hidden rounded-2xl border border-zinc-800 bg-[#121214] text-zinc-100 shadow-2xl transition-all font-sans antialiased",
        "w-[560px] min-w-[560px] max-w-[560px]",
        className
      )}
    >
      {/* ================================================================== */}
      {/* 3-Column Layout: [Presets] | [Calendar] | [Time Slots]              */}
      {/* ================================================================== */}
      <div className="flex flex-row w-full h-[330px]">
        {/* ---------------------------------------------------------------- */}
        {/* Panel 1 (Left): Presets List matching screenshot                 */}
        {/* ---------------------------------------------------------------- */}
        <div className="w-[136px] min-w-[136px] shrink-0 py-3 px-2.5 border-r border-zinc-800 flex flex-col gap-0.5 bg-[#121214]">
          {presets.map((preset) => {
            const isActive = activePresetId === preset.id

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={cn(
                  "w-full text-left rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors truncate outline-hidden",
                  isActive
                    ? "bg-zinc-800 text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                )}
              >
                {preset.label}
              </button>
            )
          })}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Panel 2 (Center): Calendar with continuous capsule & white badge */}
        {/* ---------------------------------------------------------------- */}
        <div
          className="w-[284px] min-w-[284px] shrink-0 p-3 flex flex-col bg-[#121214]"
          onPointerLeave={() => {
            if (pickingRangeStart) {
              setHoverISO(null)
            }
          }}
        >
          {/* Mode Switcher: Single Date vs Duration/Range */}
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-1 rounded-lg bg-zinc-900/90 p-0.5 border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => handleModeChange("single")}
                className={cn(
                  "px-2 py-0.5 rounded-md font-medium transition-all text-xs outline-hidden",
                  mode === "single"
                    ? "bg-zinc-800 text-white font-semibold shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                Single Date
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("range")}
                className={cn(
                  "px-2 py-0.5 rounded-md font-medium transition-all text-xs outline-hidden",
                  mode === "range"
                    ? "bg-[#4772fa] text-white font-semibold shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                Duration
              </button>
            </div>

            {mode === "range" && (
              <span className="text-xs font-semibold text-[#4772fa] truncate max-w-[110px]">
                {pickingRangeStart ? "Select end date" : endDate ? "Duration set" : "Pick range"}
              </span>
            )}
          </div>

          {/* Header: < Month Year > */}
          <div className="flex items-center justify-between pb-2 px-0.5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              transition={SPRING_PRESS}
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="size-7 shrink-0 rounded-lg inline-flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            >
              <ChevronLeft className="size-4" />
            </motion.button>

            <span className="text-sm font-semibold text-zinc-100 whitespace-nowrap tracking-wide select-none">
              {format(viewDate, "MMMM yyyy")}
            </span>

            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              transition={SPRING_PRESS}
              onClick={handleNextMonth}
              aria-label="Next month"
              className="size-7 shrink-0 rounded-lg inline-flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            >
              <ChevronRight className="size-4" />
            </motion.button>
          </div>

          {/* Weekday Labels (Su Mo Tu We Th Fr Sa) */}
          <div className="grid grid-cols-7 mb-1 text-center w-full">
            {WEEKDAY_NAMES.map((name) => (
              <span
                key={name}
                className="w-9 h-7 inline-flex items-center justify-center text-xs font-medium text-zinc-500 select-none"
              >
                {name}
              </span>
            ))}
          </div>

          {/* Month Days Grid with Animated Month Transition */}
          <div className="relative overflow-hidden w-full flex-1">
            <AnimatePresence
              mode="wait"
              custom={slideDirection}
              initial={false}
            >
              <motion.div
                key={`${viewDate.getFullYear()}-${viewDate.getMonth()}`}
                custom={slideDirection}
                initial={{
                  opacity: 0,
                  x: slideDirection > 0 ? 12 : slideDirection < 0 ? -12 : 0,
                }}
                animate={{ opacity: 1, x: 0 }}
                exit={{
                  opacity: 0,
                  x: slideDirection > 0 ? -12 : 12,
                }}
                transition={{ duration: 0.16, ease: EASE_OUT }}
                className="flex flex-col gap-1 w-full"
              >
                {calendarWeeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="grid grid-cols-7 w-full">
                    {week.map((day) => {
                      const iso = day.iso
                      const isToday = iso === todayISO
                      const { from, to } = currentRange

                      const hasValidRange = Boolean(from && to && from !== to)
                      const isStart = Boolean(from && iso === from)
                      const isEnd = Boolean(to && iso === to)
                      const isSingle = Boolean(from && !hasValidRange && iso === from)
                      const isInRange = Boolean(hasValidRange && from && to && iso > from && iso < to)
                      const isEndpoint = isStart || isEnd || isSingle

                      // Range capsule rendering calculations
                      const showLeftCapsule =
                        hasValidRange &&
                        ((isInRange && day.colIndex > 0) || (isEnd && day.colIndex > 0))
                      const showRightCapsule =
                        hasValidRange &&
                        ((isInRange && day.colIndex < 6) || (isStart && day.colIndex < 6))

                      return (
                        <div
                          key={iso}
                          className="relative size-9 flex items-center justify-center"
                          onPointerEnter={() => {
                            if (pickingRangeStart && mode === "range") {
                              setHoverISO(iso)
                            }
                          }}
                        >
                          {/* Left Half Capsule Track */}
                          {showLeftCapsule && (
                            <span
                              aria-hidden="true"
                              className={cn(
                                "pointer-events-none absolute inset-y-0.5 left-0 w-1/2 bg-[#27272a]",
                                isInRange && day.colIndex === 0 && "rounded-l-xl"
                              )}
                            />
                          )}

                          {/* Right Half Capsule Track */}
                          {showRightCapsule && (
                            <span
                              aria-hidden="true"
                              className={cn(
                                "pointer-events-none absolute inset-y-0.5 right-0 w-1/2 bg-[#27272a]",
                                isInRange && day.colIndex === 6 && "rounded-r-xl"
                              )}
                            />
                          )}

                          {/* Full Middle Capsule Track */}
                          {isInRange && (
                            <span
                              aria-hidden="true"
                              className={cn(
                                "pointer-events-none absolute inset-y-0.5 inset-x-0 bg-[#27272a]",
                                day.colIndex === 0 && "rounded-l-xl",
                                day.colIndex === 6 && "rounded-r-xl"
                              )}
                            />
                          )}

                          {/* Day Button */}
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.92 }}
                            transition={SPRING_PRESS}
                            onClick={() => handleDayClick(day)}
                            className={cn(
                              "relative z-10 size-8 rounded-xl text-xs font-semibold tabular-nums flex items-center justify-center transition-all outline-hidden select-none",
                              // Selected endpoint: elevated white badge
                              isEndpoint
                                ? "bg-white text-zinc-950 font-bold shadow-xs hover:bg-white"
                                : isInRange
                                ? "text-zinc-100 font-semibold"
                                : day.isOutside
                                ? "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/40"
                                : "text-zinc-200 hover:text-white hover:bg-zinc-800/70"
                            )}
                          >
                            <span>{day.dayNumber}</span>

                            {/* Today Dot Indicator: centered underneath number */}
                            {isToday && (
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full",
                                  isEndpoint ? "bg-zinc-950" : "bg-white"
                                )}
                              />
                            )}
                          </motion.button>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Panel 3 (Right): Time Slots Column                               */}
        {/* ---------------------------------------------------------------- */}
        <div className="w-[138px] min-w-[138px] shrink-0 border-l border-zinc-800 flex flex-col bg-[#121214]">
          {/* Header displaying formatted selected date */}
          <div className="h-10 shrink-0 flex items-center justify-center px-3 border-b border-zinc-800">
            <span className="text-xs font-semibold text-zinc-100 truncate whitespace-nowrap">
              {timeHeader}
            </span>
          </div>

          {/* Scrollable list of 30-min time slots */}
          <ScrollArea className="flex-1 h-[280px]">
            <div className="flex flex-col gap-1.5 p-2.5">
              {TIME_SLOTS.map((timeSlot) => {
                const isSelected = dueTime === timeSlot

                return (
                  <button
                    key={timeSlot}
                    type="button"
                    onClick={() => handleTimeClick(timeSlot)}
                    className={cn(
                      "h-8 w-full rounded-lg border text-xs font-mono font-medium transition-all flex items-center justify-center tabular-nums outline-hidden",
                      isSelected
                        ? "border-[#4772fa] bg-[#4772fa] text-white font-semibold shadow-xs"
                        : "border-zinc-800/80 bg-zinc-900/30 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/70 hover:text-white"
                    )}
                  >
                    {timeSlot}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* ================================================================== */}
      {/* Footer Bar: Selection summary, Clear button & Done button          */}
      {/* ================================================================== */}
      <div className="h-12 shrink-0 flex items-center justify-between border-t border-zinc-800 bg-zinc-900/40 px-3.5">
        <div className="flex items-center gap-1.5 text-xs truncate max-w-[340px]">
          <CalendarIcon className="size-3.5 shrink-0 text-[#4772fa]" />
          <span className="font-medium text-zinc-200 truncate">{summaryText}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {dueDate && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleClear}
              className="h-7 gap-1 px-2 text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
            >
              <X className="size-3" />
              Clear
            </Button>
          )}

          <Button
            type="button"
            size="xs"
            onClick={onClose}
            className="h-7 gap-1 px-3 text-xs font-semibold bg-[#4772fa] hover:bg-[#3e64dc] text-white shadow-xs"
          >
            <Check className="size-3" />
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MotionDateRangeTimePicker
