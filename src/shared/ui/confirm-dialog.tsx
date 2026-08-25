"use client";

import type { ReactNode } from "react";

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";

type ConfirmDialogProps = {
  cancelButton: ReactNode;
  confirmButton: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  open: boolean;
  title: ReactNode;
};

export function ConfirmDialog({ cancelButton, confirmButton, description, onClose, open, title }: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root onOpenChange={(nextOpen) => !nextOpen && onClose()} open={open}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Backdrop className="data-open:fade-in-0 data-closed:fade-out-0 fixed inset-0 isolate z-50 bg-foreground/10 duration-100 data-closed:animate-out data-open:animate-in supports-backdrop-filter:backdrop-blur-xs" />
        <AlertDialogPrimitive.Popup className="data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 -translate-y-1/2 gap-2 rounded-xl bg-popover p-5 text-popover-foreground outline-none ring-1 ring-foreground/10 duration-100 data-closed:animate-out data-open:animate-in">
          <AlertDialogPrimitive.Title className="font-bold text-xl leading-7" data-slot="confirm-dialog-title">
            {title}
          </AlertDialogPrimitive.Title>
          {description ? (
            <AlertDialogPrimitive.Description
              className="whitespace-pre-line text-left font-medium text-muted-foreground text-sm leading-5.5"
              data-slot="confirm-dialog-description"
            >
              {description}
            </AlertDialogPrimitive.Description>
          ) : null}
          <div className="mt-3 flex gap-2 *:min-h-12 *:flex-1">
            {cancelButton}
            {confirmButton}
          </div>
        </AlertDialogPrimitive.Popup>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
