"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangleIcon } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone. This will permanently delete the item and remove all associated data from our servers.",
  onConfirm,
  confirmLabel = "Delete",
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = () => {
    onOpenChange(false);
    try {
      onConfirm();
    } catch (e) {
      console.error("Delete confirmation failed:", e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-start gap-3 text-left">
            <div className="bg-destructive/10 text-destructive rounded-full flex size-10 shrink-0 items-center justify-center">
              <AlertTriangleIcon className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <DialogTitle className="tt-heading font-semibold text-[var(--tt-text)]">
                {title}
              </DialogTitle>
              <DialogDescription className="tt-body text-[var(--tt-muted)]">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2 mt-4">
          <DialogClose asChild>
            <Button
              variant="outline"
              disabled={isDeleting}
              className="border-[var(--tt-border)] bg-[var(--tt-panel-alt)] hover:bg-[var(--tt-panel-alt)]/80 text-[var(--tt-text)]"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
