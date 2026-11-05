"use client";

import type { AriaRole, ReactNode } from "react";
import { useRef } from "react";

import { usePress } from "glisse";

import { cn } from "@/shared/lib/utils";

type PressScaleProps = {
  "aria-label"?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  role?: AriaRole;
};

export function PressScale({ "aria-label": ariaLabel, children, className, disabled, role }: PressScaleProps) {
  const ref = useRef<HTMLDivElement>(null);
  usePress(ref, "[data-press-scale-exempt]");

  return (
    <div
      ref={ref}
      aria-label={ariaLabel}
      data-disabled={disabled ? "" : undefined}
      // 늘어난 칸을 그대로 받으면 상자 가운데를 기준으로 커져서, 안의 버튼이 제자리에서 부풀지 않고 옆으로 밀린다.
      className={cn("motion-reduce:translate-none! w-fit motion-reduce:scale-none!", className)}
      role={role}
    >
      {children}
    </div>
  );
}

export function PressScaleExempt({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className} data-press-scale-exempt="">
      {children}
    </div>
  );
}
