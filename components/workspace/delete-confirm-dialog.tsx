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
      <DialogContent className="sm:max-w-[425px] rounded-[8px] border border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-text)] shadow-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3 text-left">
            <div className="bg-[rgba(255,0,26,0.1)] text-[#eb5757] rounded-[6px] flex size-9 shrink-0 items-center justify-center">
              <AlertTriangleIcon className="size-4.5" />
            </div>
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-sm font-semibold text-[var(--app-text)]">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--app-muted)]">
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
              className="h-7 rounded-[4px] border-[var(--app-border)] bg-[var(--app-panel)] hover:bg-[var(--app-hover)] text-xs text-[var(--app-text)]"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="h-7 rounded-[4px] text-xs font-medium bg-[#eb5757] hover:bg-[#eb5757]/90 text-white"
          >
            {isDeleting ? "Deleting..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
