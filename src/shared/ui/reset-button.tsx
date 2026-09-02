"use client";

import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";

import { IconButton } from "@/shared/ui/icon-button";

type Props = {
  "aria-label"?: string;
  className?: string;
  onReset: () => void;
};

export function ResetButton({ "aria-label": ariaLabel = "초기화", className, onReset }: Props) {
  return (
    <IconButton
      aria-label={ariaLabel}
      className={className}
      icon={ArrowCounterClockwiseIcon}
      iconStrokeWidth={3}
      onClick={onReset}
      size="sm"
      type="button"
    />
  );
}
