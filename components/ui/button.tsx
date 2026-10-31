import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[4px] font-medium text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--app-bg)] disabled:pointer-events-none disabled:opacity-40 [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer select-none",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-7 px-2.5 py-1 text-xs rounded-[4px]",
        icon: "size-7 rounded-[4px]",
        "icon-sm": "size-6 rounded-[3px]",
        "icon-xs": "size-5 rounded-[3px]",
        lg: "h-8 rounded-md px-3.5 text-sm",
        sm: "h-6.5 rounded-[4px] px-2 text-xs",
        xs: "h-6 rounded-[3px] px-1.5 text-[11px]",
      },
      variant: {
        default:
          "bg-[var(--app-accent)] text-white hover:bg-[var(--app-accent-strong)] shadow-[0_1px_2px_rgba(15,15,15,0.1)] active:opacity-90",
        destructive:
          "bg-[#e03e3e] text-white hover:bg-[#c73434] shadow-[0_1px_2px_rgba(15,15,15,0.1)]",
        ghost: "hover:bg-[var(--app-hover)] text-[var(--app-text)]",
        link: "text-[var(--app-accent)] underline-offset-4 hover:underline",
        outline:
          "border border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-text)] hover:bg-[var(--app-hover)] shadow-[0_1px_2px_rgba(15,15,15,0.04)]",
        secondary:
          "bg-[var(--app-panel-alt)] text-[var(--app-text)] hover:bg-[var(--app-hover)] border border-[var(--app-border)]/70",
      },
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      className={cn(buttonVariants({ className, size, variant }))}
      data-slot="button"
      {...props}
    />
  );
}

export { Button, buttonVariants };
