"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { TriangleAlertIcon } from "@animateicons/react/lucide";
import { XIcon } from "@phosphor-icons/react";

import { type Notice, type NoticeIcon, type NoticeIconHandle, subscribeNotice } from "@/shared/lib/notice";
import { IconButton } from "@/shared/ui/icon-button";

const EXIT_DURATION = 180;

function AnimatedNoticeIcon({ Icon }: { Icon: NoticeIcon }) {
  const iconRef = useRef<NoticeIconHandle>(null);

  useEffect(() => {
    const startAnimation = iconRef.current?.startAnimation;
    if (typeof startAnimation === "function") startAnimation();
  }, []);

  return <Icon ref={iconRef} duration={0.8} size={40} />;
}

export function NoticeProvider() {
  const [notice, setNotice] = useState<Notice>();
  const [open, setOpen] = useState(false);

  const noticeRef = useRef<HTMLElement>(null);
  const dismissTimerRef = useRef<number | undefined>(undefined);
  const removeTimerRef = useRef<number | undefined>(undefined);

  const clearTimers = useCallback(() => {
    window.clearTimeout(dismissTimerRef.current);
    window.clearTimeout(removeTimerRef.current);
  }, []);

  const dismiss = useCallback(() => {
    clearTimers();
    setOpen(false);
    removeTimerRef.current = window.setTimeout(() => setNotice(undefined), EXIT_DURATION);
  }, [clearTimers]);

  useEffect(() => {
    const unsubscribe = subscribeNotice((nextNotice) => {
      clearTimers();
      setNotice(nextNotice);
      setOpen(true);
      dismissTimerRef.current = window.setTimeout(dismiss, nextNotice.variant === "success" ? 2000 : 4000);
    });

    return () => {
      clearTimers();
      unsubscribe();
    };
  }, [clearTimers, dismiss]);

  useEffect(() => {
    if (!notice || !open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && noticeRef.current?.contains(target)) return;
      dismiss();
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [dismiss, notice, open]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dismiss]);

  if (!notice) return null;

  const isError = notice.variant === "error";
  const iconColor =
    notice.variant === "success" ? "text-success" : notice.variant === "warning" ? "text-warning" : "text-destructive";

  return (
    <div
      aria-live={isError ? "assertive" : "polite"}
      className="pointer-events-none fixed inset-0 z-60 flex items-center justify-center p-6"
      role={isError ? "alert" : "status"}
    >
      <section
        className="data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 pointer-events-auto relative min-w-44 rounded-3xl border border-border/70 bg-surface px-7 py-6 text-center shadow-(--shadow-notice) data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fill-mode-forwards data-[state=closed]:duration-180 data-[state=open]:duration-250 motion-reduce:data-[state=closed]:duration-100 motion-reduce:data-[state=open]:duration-100"
        data-state={open ? "open" : "closed"}
        ref={noticeRef}
      >
        <IconButton
          aria-label="알림 닫기"
          className="absolute top-2 right-2"
          icon={XIcon}
          iconStrokeWidth={2}
          onClick={dismiss}
          size="sm"
        />
        <div className={`mx-auto mb-3 grid size-16 place-items-center ${iconColor}`}>
          <AnimatedNoticeIcon
            Icon={notice.variant === "success" ? notice.icon : TriangleAlertIcon}
            key={notice.title}
          />
        </div>
        <p className="whitespace-pre-line font-semibold text-base text-foreground leading-6">{notice.title}</p>
        {notice.description ? (
          <p className="mt-1 whitespace-pre-line text-muted-foreground text-sm leading-5">{notice.description}</p>
        ) : null}
      </section>
    </div>
  );
}
