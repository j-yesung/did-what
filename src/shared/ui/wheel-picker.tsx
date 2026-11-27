"use client";

import { type ReactNode, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { WheelPicker as WheelPickerPrimitive, WheelPickerWrapper } from "@ncdai/react-wheel-picker";

import { cn } from "@/shared/lib/utils";

type WheelOption = { label: string; value: number };

type WheelPickerProps = {
  "aria-label": string;
  className?: string;
  infinite?: boolean;
  onValueChange: (value: number) => void;
  options: WheelOption[];
  value: number;
};

const WHEEL_CLASS_NAMES = {
  highlightItem: "font-bold text-[19px] tabular-nums",
  highlightWrapper: "bg-muted text-foreground",
  optionItem: "font-semibold text-[19px] text-muted-foreground tabular-nums",
};

export function WheelPicker({
  "aria-label": ariaLabel,
  className,
  infinite,
  onValueChange,
  options,
  value,
}: WheelPickerProps) {
  const selected = options.find((option) => option.value === value)?.label ?? "";
  const latestValue = useRef(value);
  latestValue.current = value;
  const [, resync] = useState(0);

  const handleValueChange = (next: number) => {
    flushSync(() => onValueChange(next));
    if (latestValue.current !== next) resync((count) => count + 1);
  };

  return (
    <div aria-label={ariaLabel} className={cn("flex min-w-0 flex-1", className)} data-slot="wheel-picker" role="group">
      <WheelPickerPrimitive
        classNames={WHEEL_CLASS_NAMES}
        infinite={infinite}
        onValueChange={handleValueChange}
        optionItemHeight={40}
        options={[...options]}
        value={value}
        visibleCount={16}
      />
      <span aria-live="polite" className="sr-only">
        {selected}
      </span>
    </div>
  );
}

export function WheelPickerGroup({
  "aria-label": ariaLabel,
  children,
  className,
}: {
  "aria-label": string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div aria-label={ariaLabel} data-base-ui-swipe-ignore="" role="group">
      <WheelPickerWrapper
        className={cn(
          "[&>[data-slot=wheel-picker]:first-child_[data-rwp-highlight-wrapper]]:rounded-l-xl [&>[data-slot=wheel-picker]:last-child_[data-rwp-highlight-wrapper]]:rounded-r-xl [&_[data-rwp-highlight-wrapper]]:rounded-none [&_[data-rwp]]:[mask-image:linear-gradient(transparent,black_30%,black_70%,transparent)]",
          className,
        )}
      >
        {children}
      </WheelPickerWrapper>
    </div>
  );
}
