"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { motion, useReducedMotion } from "motion/react";

import { CircleCheckFilledIcon } from "@/shared/assets/icons/circle-check-filled";
import { TriangleAlertFilledIcon } from "@/shared/assets/icons/triangle-alert-filled";
import { shouldDismissToast, subscribeToast, type Toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";

const EXIT_DURATION = 500;

/**
 * 결과를 알리는 띠. 화면 아래에서 올라와 스스로 사라진다.
 *
 * 읽고 나면 할 일이 없는 알림이라 화면 가운데를 막지 않는다. 되돌릴 수 있는 선택을 묻는 건 ConfirmDialog가 맡는다.
 * 다시 해볼 방법이 있는 조회 실패는 LoadErrorAlert가 화면 안에서 버튼과 함께 보여준다.
 */
export function ToastProvider() {
  // 같은 알림이 연달아 와도 다시 올라와야 해서 요소를 갈아끼울 수 있게 번호를 함께 들고 있는다.
  const [entry, setEntry] = useState<{ id: number; toast: Toast }>();
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const idRef = useRef(0);
  const dismissTimerRef = useRef<number | undefined>(undefined);
  const removeTimerRef = useRef<number | undefined>(undefined);

  const clearTimers = useCallback(() => {
    window.clearTimeout(dismissTimerRef.current);
    window.clearTimeout(removeTimerRef.current);
  }, []);

  const dismiss = useCallback(() => {
    clearTimers();
    setOpen(false);
    removeTimerRef.current = window.setTimeout(() => setEntry(undefined), EXIT_DURATION);
  }, [clearTimers]);

  useEffect(() => {
    const unsubscribe = subscribeToast((nextToast) => {
      clearTimers();
      idRef.current += 1;
      setEntry({ id: idRef.current, toast: nextToast });
      setOpen(true);
      dismissTimerRef.current = window.setTimeout(dismiss, nextToast.variant === "success" ? 2000 : 4000);
    });

    return () => {
      clearTimers();
      unsubscribe();
    };
  }, [clearTimers, dismiss]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dismiss]);

  const toast = entry?.toast;
  const isSuccess = toast?.variant === "success";
  const hiddenTransform = reduceMotion ? "translateY(0)" : "translateY(100%)";
  const announcement = toast ? [toast.title, toast.description].filter(Boolean).join(". ") : "";

  return (
    <>
      {/**
       * 스크린리더는 새로 생긴 읽기 영역의 첫 내용을 자주 놓친다. 영역은 늘 두고 안의 글자만 바꾼다.
       * 오류·경고는 하던 일을 끊고 읽도록 alert로 나눈다. 보이는 띠는 두 번 읽히지 않게 숨긴다.
       */}
      <div aria-atomic="true" className="sr-only" role="status">
        {isSuccess ? announcement : ""}
      </div>
      <div aria-atomic="true" className="sr-only" role="alert">
        {toast && !isSuccess ? announcement : ""}
      </div>
      {entry && toast ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 bottom-[max(calc(var(--nav-clearance)-8px),calc(env(safe-area-inset-bottom)+16px))] z-60 flex justify-center px-4"
        >
          <motion.section
            key={entry.id}
            animate={{ opacity: open ? 1 : 0, transform: open ? "translateY(0)" : hiddenTransform }}
            className="w-fit max-w-full"
            initial={{ opacity: 0, transform: hiddenTransform }}
            transition={{
              opacity: {
                duration: reduceMotion ? 0.1 : open ? 0.4 : EXIT_DURATION / 1000,
                ease: open ? [0.23, 1, 0.32, 1] : [0.25, 0.1, 0.25, 1],
              },
              transform: {
                duration: reduceMotion ? 0.1 : 0.4,
                ease: open ? [0.23, 1, 0.32, 1] : [0.25, 0.1, 0.25, 1],
              },
            }}
          >
            <motion.div
              className="pointer-events-auto flex touch-pan-x select-none items-center gap-2 rounded-3xl border border-transparent bg-toast px-4 py-2.5 text-toast-foreground shadow-(--shadow-toast)"
              drag="y"
              dragConstraints={{ bottom: 0, top: 0 }}
              dragElastic={{ bottom: 0.5, top: 0 }}
              dragMomentum={false}
              onDragEnd={(_event, info) => {
                if (shouldDismissToast(info.offset.y, info.velocity.y)) dismiss();
              }}
            >
              {isSuccess ? (
                <CircleCheckFilledIcon aria-hidden="true" className="size-5 shrink-0 self-start text-success" />
              ) : (
                <TriangleAlertFilledIcon
                  aria-hidden="true"
                  className={cn(
                    "size-5 shrink-0 self-start",
                    toast.variant === "warning" ? "text-warning" : "text-destructive",
                  )}
                />
              )}
              <div className="min-w-0">
                <p className="whitespace-pre-line font-medium text-sm leading-5">{toast.title}</p>
                {toast.description ? (
                  <p className="whitespace-pre-line text-sm leading-5 opacity-80">{toast.description}</p>
                ) : null}
              </div>
            </motion.div>
          </motion.section>
        </div>
      ) : null}
    </>
  );
}
