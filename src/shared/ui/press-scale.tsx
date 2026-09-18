"use client";

import type { AriaRole, ReactNode } from "react";
import { useEffect, useRef } from "react";

import { motion, useMotionTemplate, useReducedMotion, useSpring } from "motion/react";

const TAP_SPRING = { damping: 10, mass: 1, stiffness: 180, type: "spring" } as const;
const TAP_SCALE = 1.2;
const MIN_PRESS_DURATION = 160;

type PressScaleProps = {
  "aria-label"?: string;
  children: ReactNode;
  className?: string;
  role?: AriaRole;
};

export function PressScale({ "aria-label": ariaLabel, children, className, role }: PressScaleProps) {
  const shouldReduceMotion = useReducedMotion();
  const scale = useSpring(1, TAP_SPRING);
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
    scale.set(TAP_SCALE);
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

  return (
    <motion.div
      aria-label={ariaLabel}
      className={className}
      onTap={handleTapEnd}
      onTapCancel={handleTapCancel}
      onTapStart={handleTapStart}
      role={role}
      style={{ transform }}
    >
      {children}
    </motion.div>
  );
}
