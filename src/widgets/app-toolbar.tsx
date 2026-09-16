"use client";

import { useEffect, useRef } from "react";

import { motion, useMotionTemplate, useReducedMotion, useSpring } from "motion/react";
import { usePathname } from "next/navigation";

import { NotificationBell } from "@/widgets/notification/notification-bell";
import { RecordCreateButton } from "@/widgets/record-create-button";

const TOOLBAR_ENTRY_PATHS = new Set(["/", "/regions", "/records", "/places", "/settings"]);
const TOOLBAR_SPRING = { damping: 10, mass: 1, stiffness: 180, type: "spring" } as const;
const TOOLBAR_SCALE = 1.14;
const MIN_PRESS_DURATION = 160;

export function AppToolbar({ memberId }: { memberId: string }) {
  const pathname = usePathname() ?? "";
  const shouldReduceMotion = useReducedMotion();
  const scale = useSpring(1, TOOLBAR_SPRING);
  const transform = useMotionTemplate`scale(${scale})`;
  const pressedAtRef = useRef(0);
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (shouldReduceMotion) scale.jump(1);

    return () => {
      if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
    };
  }, [scale, shouldReduceMotion]);

  const handleTapStart = () => {
    if (shouldReduceMotion) return;
    if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);

    pressedAtRef.current = performance.now();
    scale.set(TOOLBAR_SCALE);
  };

  const handleTapEnd = () => {
    if (shouldReduceMotion) return;
    if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);

    const remainingDuration = Math.max(0, MIN_PRESS_DURATION - (performance.now() - pressedAtRef.current));
    releaseTimerRef.current = setTimeout(() => {
      releaseTimerRef.current = null;
      scale.set(1);
    }, remainingDuration);
  };

  const handleTapCancel = () => {
    if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
    releaseTimerRef.current = null;
    scale.set(1);
  };

  if (!TOOLBAR_ENTRY_PATHS.has(pathname)) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30">
      <div className="mx-auto flex w-full max-w-(--app-width) justify-end px-5 pt-[calc(24px+env(safe-area-inset-top))]">
        <motion.div
          aria-label="빠른 작업"
          className="app-toolbar liquid-glass liquid-glass-toolbar pointer-events-auto flex items-center gap-0.5 rounded-full border p-0.5"
          onTap={handleTapEnd}
          onTapCancel={handleTapCancel}
          onTapStart={handleTapStart}
          role="group"
          style={{ transform }}
        >
          <RecordCreateButton />
          <NotificationBell memberId={memberId} />
        </motion.div>
      </div>
    </div>
  );
}
