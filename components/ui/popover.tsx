"use client";

import { Popover as PopoverPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  render,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger> & {
  render?: React.ReactElement;
}) {
  if (render) {
    const renderChildren = (render.props as { children?: React.ReactNode })?.children;
    return (
      <PopoverPrimitive.Trigger data-slot="popover-trigger" asChild {...props}>
        {React.cloneElement(render, undefined, children ?? renderChildren)}
      </PopoverPrimitive.Trigger>
    );
  }
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props}>{children}</PopoverPrimitive.Trigger>;
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  showArrow = false,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  showArrow?: boolean;
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        className={cn(
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 z-50 w-72 rounded-md border border-[var(--app-border)] bg-[var(--app-panel)] p-3 text-[var(--app-text)] shadow-[0_4px_16px_rgba(15,15,15,0.1),0_0_0_1px_rgba(15,15,15,0.08)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.08)] outline-hidden data-[state=closed]:animate-out data-[state=open]:animate-in",
          className,
        )}
        data-slot="popover-content"
        sideOffset={sideOffset}
        {...props}
      >
        {props.children}
        {showArrow && (
          <PopoverPrimitive.Arrow className="-my-px fill-popover drop-shadow-[0_1px_0_var(--border)]" />
        )}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
