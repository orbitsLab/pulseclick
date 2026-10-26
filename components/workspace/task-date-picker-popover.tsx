"use client"

import * as React from "react"
import { MotionDateRangeTimePicker } from "./motion-date-range-time-picker"

export interface TaskDatePickerPopoverProps {
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
  /** Optional class name */
  className?: string
  /** Allow selecting past dates (defaults to true) */
  allowPastDates?: boolean
  /** Initial mode */
  defaultMode?: "single" | "range"
}

export function TaskDatePickerPopover({
  dueDate,
  endDate,
  dueTime,
  endTime,
  onSelect,
  onClose,
  className,
  allowPastDates = true,
  defaultMode = "single",
}: TaskDatePickerPopoverProps) {
  return (
    <MotionDateRangeTimePicker
      dueDate={dueDate}
      endDate={endDate}
      dueTime={dueTime}
      endTime={endTime}
      onSelect={onSelect}
      onClose={onClose}
      className={className}
      allowPastDates={allowPastDates}
      defaultMode={defaultMode}
    />
  )
}

export default TaskDatePickerPopover
