"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
import { PressLink } from "@/shared/ui/press-link";

type CalendarRecordCreateButtonProps = {
  date: string | null;
};

const ENTRY_EASING = [0.23, 1, 0.32, 1] as const;

export function CalendarRecordCreateButton({ date }: CalendarRecordCreateButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const hiddenTransform = shouldReduceMotion ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)";

  return (
    <div aria-live="polite" className="pointer-events-none flex min-w-0 justify-center px-2">
      <AnimatePresence initial={false}>
        {date ? (
          <motion.div
            animate={{ opacity: 1, transform: "translateY(0) scale(1)" }}
            exit={{ opacity: 0, transform: hiddenTransform }}
            initial={{ opacity: 0, transform: hiddenTransform }}
            key="calendar-record-create"
            transition={{ duration: 0.18, ease: ENTRY_EASING }}
          >
            <div className="calendar-record-create-float pointer-events-auto">
              <PressLink
                className={cn(buttonVariants({ size: "large" }), "rounded-full shadow-lg")}
                href={`/records/new?date=${date}`}
                prefetch
              >
                기록 남기기
              </PressLink>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
