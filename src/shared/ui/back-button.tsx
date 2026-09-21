"use client";

import { CaretLeftIcon } from "@phosphor-icons/react";

import { ICON_WEIGHT_MEDIUM } from "@/shared/lib/interaction";
import { useGoBack } from "@/shared/lib/navigation/use-go-back";
import { cn } from "@/shared/lib/utils";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { PressScale } from "@/shared/ui/press-scale";

type Props = {
  "aria-label"?: string;
  disabled?: boolean;
  fallbackHref?: string;
  /** 돌아가는 방식이 따로 있을 때. 넘기지 않으면 왔던 화면으로 돌아간다. */
  onClick?: () => void;
};

export function BackButton({
  "aria-label": ariaLabel = "이전 화면으로",
  disabled,
  fallbackHref = "/",
  onClick,
}: Props) {
  const goBackTo = useGoBack();

  return (
    <PressScale className="pointer-events-auto inline-flex">
      <LiquidGlassButton
        aria-label={ariaLabel}
        className={cn("[&_svg]:size-6.75", ICON_WEIGHT_MEDIUM)}
        disabled={disabled}
        onClick={onClick ?? (() => goBackTo(fallbackHref))}
        shape="circle"
      >
        <CaretLeftIcon data-icon="inline-start" weight="regular" />
      </LiquidGlassButton>
    </PressScale>
  );
}
