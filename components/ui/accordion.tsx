"use client"

import * as React from "react"
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { cn } from "cn"
import { ChevronDownIcon } from "lucide-react"

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  )
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("not-last:border-b border-[var(--app-border)]/50", className)}
      {...props}
    />
  )
}

export interface AccordionTriggerProps extends AccordionPrimitive.Trigger.Props {
  header?: boolean
  hideChevron?: boolean
}

function AccordionTrigger({
  className,
  children,
  header = true,
  hideChevron = false,
  ...props
}: AccordionTriggerProps) {
  const triggerButton = (
    <AccordionPrimitive.Trigger
      data-slot="accordion-trigger"
      className={cn(
        "group/accordion-trigger relative flex flex-1 items-center justify-between text-left text-sm font-medium transition-all outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",
        header ? "py-2.5 hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" : "",
        className
      )}
      {...props}
    >
      {children}
      {!hideChevron && (
        <ChevronDownIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none shrink-0 transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-180 group-data-[panel-open]/accordion-trigger:rotate-180"
        />
      )}
    </AccordionPrimitive.Trigger>
  )

  if (!header) {
    return triggerButton
  }

  return (
    <AccordionPrimitive.Header className="flex">
      {triggerButton}
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className={cn(
        "overflow-hidden text-sm transition-[height] duration-200 ease-out h-[var(--accordion-panel-height)] data-starting-style:h-0 data-ending-style:h-0",
        className
      )}
      {...props}
    >
      <div className="pt-0 pb-2">
        {children}
      </div>
    </AccordionPrimitive.Panel>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
