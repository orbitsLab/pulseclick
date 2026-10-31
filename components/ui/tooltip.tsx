"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cn } from "cn"

function TooltipProvider({
  delay = 150,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  )
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 6,
  align = "center",
  alignOffset = 0,
  children,
  showArrow = false,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  > & {
    showArrow?: boolean
  }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50 pointer-events-none"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 inline-flex w-fit max-w-xs items-center gap-1.5 rounded-[4px] border border-[var(--app-border)]/50 bg-[#191919] px-2 py-1 text-[11px] font-medium text-white shadow-md select-none dark:bg-[#262626] dark:text-[#f0efed] dark:border-[var(--app-border)] transition-opacity animate-in fade-in-0 zoom-in-95 duration-100",
            className
          )}
          {...props}
        >
          {children}
          {showArrow && (
            <TooltipPrimitive.Arrow className="z-50 size-2 rotate-45 rounded-[1px] bg-[#191919] fill-[#191919] dark:bg-[#262626] dark:fill-[#262626]" />
          )}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export interface SideTooltipProps {
  content: React.ReactNode
  description?: React.ReactNode
  shortcut?: string
  side?: "right" | "left" | "top" | "bottom"
  sideOffset?: number
  align?: "center" | "start" | "end"
  children: React.ReactElement<{ title?: string }>
  delay?: number
  className?: string
  disabled?: boolean
}

export function SideTooltip({
  content,
  description,
  shortcut,
  side = "right",
  sideOffset = 8,
  align = "center",
  children,
  delay = 200,
  className,
  disabled = false,
}: SideTooltipProps) {
  if (disabled || !content) return children

  // Strip native title attribute if present to avoid dual browser native tooltip
  const triggerElement = children.props?.title
    ? React.cloneElement(children, { title: undefined })
    : children

  return (
    <TooltipProvider delay={delay}>
      <Tooltip>
        <TooltipTrigger render={triggerElement} />
        <TooltipContent
          side={side}
          sideOffset={sideOffset}
          align={align}
          className={cn(
            "z-50 rounded-[4px] border border-white/10 dark:border-[#383838] bg-[#191919] dark:bg-[#252525] px-2 py-1 text-[11px] font-medium text-white dark:text-[#f0efed] shadow-[0_2px_8px_rgba(0,0,0,0.22),0_1px_2px_rgba(0,0,0,0.15)] select-none",
            description ? "flex flex-col gap-0.5 text-left max-w-xs" : "inline-flex items-center gap-1.5",
            className
          )}
        >
          {description ? (
            <>
              <div className="flex items-center gap-1.5 font-medium leading-tight">
                <span>{content}</span>
                {shortcut && (
                  <kbd className="rounded-[3px] bg-white/20 dark:bg-white/15 px-1 py-0.5 font-mono text-[9px] font-semibold text-white/90">
                    {shortcut}
                  </kbd>
                )}
              </div>
              <span className="text-[10px] text-white/70 dark:text-[#a0a0a0] font-normal leading-snug">
                {description}
              </span>
            </>
          ) : (
            <>
              <span className="leading-tight">{content}</span>
              {shortcut && (
                <kbd className="rounded-[3px] bg-white/20 dark:bg-white/15 px-1 py-0.5 font-mono text-[9px] font-semibold text-white/90">
                  {shortcut}
                </kbd>
              )}
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
