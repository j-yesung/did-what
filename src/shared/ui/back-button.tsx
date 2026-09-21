"use client";

import { CaretLeftIcon } from "@phosphor-icons/react";

import { ICON_WEIGHT_MEDIUM } from "@/shared/lib/interaction";
import { useGoBack } from "@/shared/lib/navigation/use-go-back";
import { cn } from "@/shared/lib/utils";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { PressScale } from "@/shared/ui/press-scale";

type Props = {
  fallbackHref?: string;
};

export function BackButton({ fallbackHref = "/" }: Props) {
  const goBackTo = useGoBack();

  return (
    <PressScale className="pointer-events-auto inline-flex">
      <LiquidGlassButton
        aria-label="이전 화면으로"
        className={cn("[&_svg]:size-6.75", ICON_WEIGHT_MEDIUM)}
        onClick={() => goBackTo(fallbackHref)}
        shape="circle"
      >
        <CaretLeftIcon data-icon="inline-start" weight="regular" />
      </LiquidGlassButton>
    </PressScale>
  );
}
