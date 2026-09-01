"use client";

import type { ComponentProps, ReactNode } from "react";

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";

import { Button } from "./button";

type ConfirmDialogProps = {
  cancelButton: ReactNode;
  confirmButton: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  open: boolean;
  title: ReactNode;
};

type ConfirmDialogCancelButtonProps = Omit<ComponentProps<typeof Button>, "color" | "variant">;

export function ConfirmDialogCancelButton({ children, ...props }: ConfirmDialogCancelButtonProps) {
  return (
    <Button color="dark" variant="weak" {...props}>
      {children}
    </Button>
  );
}

export function ConfirmDialog({ cancelButton, confirmButton, description, onClose, open, title }: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root onOpenChange={(nextOpen) => !nextOpen && onClose()} open={open}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Backdrop className="data-open:fade-in-0 data-closed:fade-out-0 fixed inset-0 isolate z-50 bg-dimmed duration-100 data-closed:animate-out data-open:animate-in data-closed:duration-100 data-open:duration-300 data-closed:ease-out data-open:ease-[cubic-bezier(0.22,1,0.36,1)]" />
        <AlertDialogPrimitive.Popup className="data-open:fade-in-0 data-open:slide-in-from-bottom-[100px] data-closed:fade-out-0 motion-reduce:data-open:slide-in-from-bottom-0 fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-1rem)] max-w-xs -translate-x-1/2 -translate-y-1/2 gap-2 rounded-2xl bg-popover p-5 text-popover-foreground outline-none data-closed:animate-out data-open:animate-in data-closed:duration-100 data-open:duration-300 data-closed:ease-out data-open:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:data-open:duration-100">
          <AlertDialogPrimitive.Title className="font-bold text-xl leading-7" data-slot="confirm-dialog-title">
            {title}
          </AlertDialogPrimitive.Title>
          {description ? (
            <AlertDialogPrimitive.Description
              className="whitespace-pre-line text-left font-medium text-[15px] text-muted-foreground leading-5.5"
              data-slot="confirm-dialog-description"
            >
              {description}
            </AlertDialogPrimitive.Description>
          ) : null}
          <div className="-mx-1 mt-3 flex gap-2 *:min-h-12 *:flex-1 *:font-semibold *:text-base">
            {cancelButton}
            {confirmButton}
          </div>
        </AlertDialogPrimitive.Popup>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
