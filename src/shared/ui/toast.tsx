"use client";

import type { ReactNode } from "react";

import { Toast } from "@base-ui/react/toast";
import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

const TOAST_TYPES = {
  success: { Icon: CircleCheckIcon, className: "text-success" },
  info: { Icon: InfoIcon, className: "text-info" },
  warning: { Icon: TriangleAlertIcon, className: "text-warning" },
  error: { Icon: CircleAlertIcon, className: "text-destructive" },
};

function ToastList() {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toast) => {
    const { Icon, className } = TOAST_TYPES[toast.type as keyof typeof TOAST_TYPES] ?? TOAST_TYPES.info;

    return (
      <Toast.Root
        className={cn(
          "flex w-full items-start gap-2.5 rounded-xl bg-popover p-3.5 text-popover-foreground shadow-lg ring-1 ring-foreground/10",
          "transition-[opacity,translate] duration-200 ease-out",
          "data-ending-style:-translate-y-2 data-starting-style:-translate-y-2 data-ending-style:opacity-0 data-starting-style:opacity-0",
        )}
        key={toast.id}
        swipeDirection="up"
        toast={toast}
      >
        <Icon aria-hidden="true" className={cn("mt-px size-[18px] shrink-0", className)} />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Toast.Title className="font-[650] text-sm leading-snug" />
          <Toast.Description className="text-muted-foreground text-xs leading-relaxed" />
        </div>
      </Toast.Root>
    );
  });
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider timeout={2000}>
      {children}

      <Toast.Portal>
        <Toast.Viewport className="fixed top-[calc(12px+env(safe-area-inset-top))] left-1/2 z-60 flex w-full max-w-[430px] -translate-x-1/2 flex-col gap-2 px-3">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

export const useToast = Toast.useToastManager;
