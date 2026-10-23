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
import type { DateRange } from "react-day-picker"

import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

export interface DatePickerWithRangePresetsProps {
  /** Selected date range (controlled) */
  value?: DateRange
  /** Default date range (uncontrolled) */
  defaultValue?: DateRange
  /** Callback fired when selection changes */
  onChange?: (range: DateRange | undefined) => void
  /** Additional container classes */
  className?: string
  /** Subtitle note below the card */
  footerNote?: string
}

export const DatePickerWithRangePresets = ({
  value,
  defaultValue,
  onChange,
  className,
  footerNote = "Range calendar with presets",
}: DatePickerWithRangePresetsProps) => {
  const today = React.useMemo(() => new Date(), [])

  // Range presets matching the exact screenshot layout
  const presets = React.useMemo(
    () => ({
      yesterday: {
        from: subDays(today, 1),
        to: subDays(today, 1),
      },
      tomorrow: {
        from: today,
        to: addDays(today, 1),
      },
      last7Days: {
        from: subDays(today, 6),
        to: today,
      },
      next7Days: {
        from: addDays(today, 1),
        to: addDays(today, 7),
      },
      last30Days: {
        from: subDays(today, 29),
        to: today,
      },
      monthToDate: {
        from: startOfMonth(today),
        to: today,
      },
      lastMonth: {
        from: startOfMonth(subMonths(today, 1)),
        to: endOfMonth(subMonths(today, 1)),
      },
      nextMonth: {
        from: startOfMonth(addMonths(today, 1)),
        to: endOfMonth(addMonths(today, 1)),
      },
      yearToDate: {
        from: startOfYear(today),
        to: today,
      },
      lastYear: {
        from: startOfYear(subYears(today, 1)),
        to: endOfYear(subYears(today, 1)),
      },
    }),
    [today]
  )

  // Uncontrolled vs controlled date range state
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(
    defaultValue ?? presets.last7Days
  )
  const date = value !== undefined ? value : internalDate

  // Calendar month state
  const [month, setMonth] = React.useState<Date>(
    date?.to || date?.from || today
  )

  const handleSelect = (newDate: DateRange | undefined) => {
    setInternalDate(newDate)
    onChange?.(newDate)
  }

  // Active preset helper
  const isPresetActive = (presetRange: DateRange) => {
    if (!date?.from || !date?.to || !presetRange.from || !presetRange.to) {
      return false
    }
    return isSameDay(presetRange.from, date.from) && isSameDay(presetRange.to, date.to)
  }

  return (
    <div className={cn("w-fit", className)}>
      <Card className="max-w-xs border-border bg-card py-4 shadow-sm">
        <CardContent className="px-4">
          <Calendar
            mode="range"
            selected={date}
            onSelect={handleSelect}
            month={month}
            onMonthChange={setMonth}
            showOutsideDays={true}
            className="w-full bg-transparent p-0 [--cell-size:--spacing(10)]"
            formatters={{
              formatWeekdayName: (dayDate) =>
                dayDate.toLocaleString("en-US", { weekday: "short" }).slice(0, 2),
            }}
            classNames={{
              day: cn(
                "relative aspect-square size-10 p-0 text-center select-none flex items-center justify-center",
                "[&[data-range-end=true]_button]:bg-white [&[data-range-end=true]_button]:text-blue-700 [&[data-range-end=true]_button]:font-semibold [&[data-range-end=true]_button]:shadow-sm",
                "[&[data-range-start=true]_button]:bg-white [&[data-range-start=true]_button]:text-blue-700 [&[data-range-start=true]_button]:font-semibold [&[data-range-start=true]_button]:shadow-sm",
                "dark:[&[data-range-end=true]_button]:bg-zinc-100 dark:[&[data-range-end=true]_button]:text-blue-700",
                "dark:[&[data-range-start=true]_button]:bg-zinc-100 dark:[&[data-range-start=true]_button]:text-blue-700"
              ),
              range_start: "rounded-l-xl bg-zinc-800 text-foreground",
              range_middle: "bg-zinc-800 text-foreground rounded-none",
              range_end: "rounded-r-xl bg-zinc-800 text-foreground",
            }}
          />
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t border-border px-4 pt-4!">
          {/* Row 1: Today, Yesterday, Tomorrow */}
          <div className="flex w-full flex-wrap gap-2">
            <Button
              type="button"
              variant={isPresetActive({ from: today, to: today }) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const r = { from: today, to: today }
                handleSelect(r)
                setMonth(today)
              }}
              className={cn(
                "h-8 rounded-lg px-3 text-xs font-medium shadow-none transition-colors",
                isPresetActive({ from: today, to: today }) &&
                  "bg-primary text-primary-foreground font-semibold"
              )}
            >
              Today
            </Button>
            <Button
              type="button"
              variant={isPresetActive(presets.yesterday) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleSelect(presets.yesterday)
                setMonth(presets.yesterday.to)
              }}
              className={cn(
                "h-8 rounded-lg px-3 text-xs font-medium shadow-none transition-colors",
                isPresetActive(presets.yesterday) &&
                  "bg-primary text-primary-foreground font-semibold"
              )}
            >
              Yesterday
            </Button>
            <Button
              type="button"
              variant={isPresetActive(presets.tomorrow) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleSelect(presets.tomorrow)
                setMonth(presets.tomorrow.to)
              }}
              className={cn(
                "h-8 rounded-lg px-3 text-xs font-medium shadow-none transition-colors",
                isPresetActive(presets.tomorrow) &&
                  "bg-primary text-primary-foreground font-semibold"
              )}
            >
              Tomorrow
            </Button>
          </div>

          {/* Row 2: Last 7 days, Next 7 days */}
          <div className="flex w-full flex-wrap gap-2">
            <Button
              type="button"
              variant={isPresetActive(presets.last7Days) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleSelect(presets.last7Days)
                setMonth(presets.last7Days.to)
              }}
              className={cn(
                "h-8 rounded-lg px-3 text-xs font-medium shadow-none transition-colors",
                isPresetActive(presets.last7Days) &&
                  "bg-primary text-primary-foreground font-semibold"
              )}
            >
              Last 7 days
            </Button>
            <Button
              type="button"
              variant={isPresetActive(presets.next7Days) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleSelect(presets.next7Days)
                setMonth(presets.next7Days.to)
              }}
              className={cn(
                "h-8 rounded-lg px-3 text-xs font-medium shadow-none transition-colors",
                isPresetActive(presets.next7Days) &&
                  "bg-primary text-primary-foreground font-semibold"
              )}
            >
              Next 7 days
            </Button>
          </div>

          {/* Row 3: Last 30 days, Month to date */}
          <div className="flex w-full flex-wrap gap-2">
            <Button
              type="button"
              variant={isPresetActive(presets.last30Days) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleSelect(presets.last30Days)
                setMonth(presets.last30Days.to)
              }}
              className={cn(
                "h-8 rounded-lg px-3 text-xs font-medium shadow-none transition-colors",
                isPresetActive(presets.last30Days) &&
                  "bg-primary text-primary-foreground font-semibold"
              )}
            >
              Last 30 days
            </Button>
            <Button
              type="button"
              variant={isPresetActive(presets.monthToDate) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleSelect(presets.monthToDate)
                setMonth(presets.monthToDate.to)
              }}
              className={cn(
                "h-8 rounded-lg px-3 text-xs font-medium shadow-none transition-colors",
                isPresetActive(presets.monthToDate) &&
                  "bg-primary text-primary-foreground font-semibold"
              )}
            >
              Month to date
            </Button>
          </div>

          {/* Row 4: Last month, Next month */}
          <div className="flex w-full flex-wrap gap-2">
            <Button
              type="button"
              variant={isPresetActive(presets.lastMonth) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleSelect(presets.lastMonth)
                setMonth(presets.lastMonth.to)
              }}
              className={cn(
                "h-8 rounded-lg px-3 text-xs font-medium shadow-none transition-colors",
                isPresetActive(presets.lastMonth) &&
                  "bg-primary text-primary-foreground font-semibold"
              )}
            >
              Last month
            </Button>
            <Button
              type="button"
              variant={isPresetActive(presets.nextMonth) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleSelect(presets.nextMonth)
                setMonth(presets.nextMonth.to)
              }}
              className={cn(
                "h-8 rounded-lg px-3 text-xs font-medium shadow-none transition-colors",
                isPresetActive(presets.nextMonth) &&
                  "bg-primary text-primary-foreground font-semibold"
              )}
            >
              Next month
            </Button>
          </div>

          {/* Row 5: Year to date, Last year */}
          <div className="flex w-full flex-wrap gap-2">
            <Button
              type="button"
              variant={isPresetActive(presets.yearToDate) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleSelect(presets.yearToDate)
                setMonth(presets.yearToDate.to)
              }}
              className={cn(
                "h-8 rounded-lg px-3 text-xs font-medium shadow-none transition-colors",
                isPresetActive(presets.yearToDate) &&
                  "bg-primary text-primary-foreground font-semibold"
              )}
            >
              Year to date
            </Button>
            <Button
              type="button"
              variant={isPresetActive(presets.lastYear) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleSelect(presets.lastYear)
                setMonth(presets.lastYear.to)
              }}
              className={cn(
                "h-8 rounded-lg px-3 text-xs font-medium shadow-none transition-colors",
                isPresetActive(presets.lastYear) &&
                  "bg-primary text-primary-foreground font-semibold"
              )}
            >
              Last year
            </Button>
          </div>
        </CardFooter>
      </Card>
      {footerNote && (
        <p className="mt-4 text-center text-xs text-muted-foreground" role="region">
          {footerNote}
        </p>
      )}
    </div>
  )
}

/**
 * Exact drop-in replacement export matching the requested snippet name
 */
export const CalendarWithRangePresetsDemo = () => {
  return <DatePickerWithRangePresets />
}

export { MotionDateRangeTimePicker } from "@/components/ticktick/motion-date-range-time-picker"

export default DatePickerWithRangePresets
