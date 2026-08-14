"use client";

import { type ReactNode, useEffect } from "react";

import { Toast } from "@base-ui/react/toast";
import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon, XIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import { FOCUS_RING, PRESS_FEEDBACK } from "#shared/lib/interaction.ts";

/** 색은 아이콘에만 쓴다. 배경까지 물들이면 무슨 색 판이 떴는지가 먼저 읽힌다. */
const TOAST_TYPES = {
  success: { Icon: CircleCheckIcon, className: "text-success" },
  info: { Icon: InfoIcon, className: "text-info" },
  warning: { Icon: TriangleAlertIcon, className: "text-warning" },
  error: { Icon: CircleAlertIcon, className: "text-destructive" },
};

type ToastType = keyof typeof TOAST_TYPES;

function ToastList({ top }: { top: boolean }) {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toast) => {
    const { Icon, className } = TOAST_TYPES[(toast.type ?? "info") as ToastType] ?? TOAST_TYPES.info;

    return (
      <Toast.Root
        className={cn(
          "flex w-full items-start gap-2.5 rounded-xl bg-popover p-3.5 text-popover-foreground shadow-lg ring-1 ring-foreground/10",
          "transition-[opacity,translate] duration-200 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0",
          top
            ? "data-ending-style:-translate-y-2 data-starting-style:-translate-y-2"
            : "data-ending-style:translate-y-2 data-starting-style:translate-y-2",
        )}
        key={toast.id}
        swipeDirection={top ? "up" : "down"}
        toast={toast}
      >
        <Icon aria-hidden="true" className={cn("mt-px size-[18px] shrink-0", className)} />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Toast.Title className="font-[650] text-sm leading-snug" />
          <Toast.Description className="text-muted-foreground text-xs leading-relaxed" />
        </div>

        <Toast.Close
          aria-label="닫기"
          className={cn(
            "-m-1.5 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground",
            FOCUS_RING,
            PRESS_FEEDBACK,
          )}
        >
          <XIcon aria-hidden="true" className="size-4" />
        </Toast.Close>
      </Toast.Root>
    );
  });
}

type ToastProviderProps = {
  children: ReactNode;
  /** 토스트가 뜨는 자리. 아래로 두면 하단 내비게이션 높이만큼 띄운다. */
  position?: "top" | "bottom";
};

export function ToastProvider({ children, position = "top" }: ToastProviderProps) {
  const top = position === "top";

  return (
    <Toast.Provider>
      {children}

      <Toast.Portal>
        <Toast.Viewport
          className={cn(
            "fixed left-1/2 z-60 flex w-full max-w-[430px] -translate-x-1/2 flex-col gap-2 px-3",
            top ? "top-[calc(12px+env(safe-area-inset-top))]" : "bottom-[var(--nav-clearance)]",
          )}
        >
          <ToastList top={top} />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

export const useToast = Toast.useToastManager;

type ActionState = { message?: string; status?: string };

/**
 * 서버 액션 결과를 토스트로 옮긴다.
 * 성공 문구를 넘기지 않으면 액션이 돌려준 message를 제목으로 쓰고, 실패는 제목 아래 message를 붙인다.
 */
export function useActionToast(state: ActionState, titles: { error: string; success?: string }) {
  const { add } = useToast();
  const { error, success } = titles;

  useEffect(() => {
    if (state.status === "error" && state.message) {
      add({ description: state.message, title: error, type: "error" });
      return;
    }

    const successTitle = success ?? state.message;

    if (state.status === "success" && successTitle) {
      add({ title: successTitle, type: "success" });
    }
  }, [add, error, state, success]);
}
