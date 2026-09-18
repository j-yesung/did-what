"use client";

import { format, parseISO } from "date-fns";
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

  if (!date) return null;

  return (
    <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
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
                {format(parseISO(date), "M월 d일")} 기록 남기기
              </PressLink>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
