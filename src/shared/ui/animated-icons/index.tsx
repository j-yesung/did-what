"use client";

import { type ComponentPropsWithoutRef, type Ref, useImperativeHandle } from "react";

import { motion, useAnimationControls, useReducedMotion } from "motion/react";

export type AnimatedIconHandle = { startAnimation: () => void; stopAnimation: () => void };
export type BookmarkIconHandle = AnimatedIconHandle;
export type CheckIconHandle = AnimatedIconHandle;
export type CircleChevronLeftIconHandle = AnimatedIconHandle;

type IconProps = ComponentPropsWithoutRef<"span"> & {
  ref?: Ref<AnimatedIconHandle>;
  size?: number;
  duration?: number;
  isAnimated?: boolean;
};

function AnimatedIcon({
  kind,
  ref,
  size = 24,
  duration = 1,
  isAnimated = true,
  children,
  ...props
}: IconProps & { kind: "bookmark" | "check" | "back" }) {
  const controls = useAnimationControls();
  const reduceMotion = useReducedMotion();
  const startAnimation = () => {
    if (!reduceMotion) void controls.start("animate");
  };
  const stopAnimation = () => controls.set("normal");
  useImperativeHandle(ref, () => ({ startAnimation, stopAnimation }));

  return (
    <span
      {...props}
      onMouseEnter={(event) => {
        props.onMouseEnter?.(event);
        if (isAnimated && window.matchMedia("(hover: hover) and (pointer: fine)").matches) startAnimation();
      }}
      onMouseLeave={(event) => {
        props.onMouseLeave?.(event);
        if (isAnimated) stopAnimation();
      }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial="normal"
        animate={controls}
        variants={{
          normal: { transform: "translateY(0px) scale(1)" },
          animate:
            kind === "bookmark"
              ? {
                  transform: ["translateY(0px) scale(1)", "translateY(-4px) scale(1.05)", "translateY(0px) scale(1)"],
                  transition: { duration: 0.45 * duration, ease: "easeOut" },
                }
              : {
                  transform: ["scale(1)", "scale(1.1)", "scale(1)"],
                  transition: { duration: 0.3 * duration, ease: "easeOut" },
                },
        }}
      >
        {kind === "bookmark" ? (
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        ) : kind === "check" ? (
          <motion.path
            d="M5 13l4 4L19 7"
            variants={{
              normal: { pathLength: 1, opacity: 1 },
              animate: {
                pathLength: [0, 1],
                opacity: [0, 1],
                transition: { duration: 0.45 * duration, ease: "easeOut" },
              },
            }}
          />
        ) : (
          <>
            <circle cx="12" cy="12" r="10" />
            <motion.path
              d="m14 16-4-4 4-4"
              variants={{
                normal: { transform: "translateX(0px)", opacity: 1 },
                animate: {
                  transform: ["translateX(10px)", "translateX(0px)"],
                  opacity: [0, 1],
                  transition: { duration: 0.6 * duration, ease: "easeOut" },
                },
              }}
            />
          </>
        )}
        {children}
      </motion.svg>
    </span>
  );
}

export function BookmarkIcon(props: IconProps) {
  return <AnimatedIcon {...props} kind="bookmark" />;
}
export function CheckIcon(props: IconProps) {
  return <AnimatedIcon {...props} kind="check" />;
}
export function CircleChevronLeftIcon(props: IconProps) {
  return <AnimatedIcon {...props} kind="back" />;
}
