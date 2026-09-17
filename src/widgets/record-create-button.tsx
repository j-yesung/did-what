"use client";

import { NotePencilIcon } from "@phosphor-icons/react";

import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { PressLink } from "@/shared/ui/press-link";

export function RecordCreateButton() {
  return (
    <LiquidGlassButton
      aria-label="기록 남기기"
      className="size-11"
      nativeButton={false}
      render={<PressLink href="/records/new" prefetch />}
      shape="circle"
      surface="group"
    >
      <NotePencilIcon data-icon="inline-start" />
    </LiquidGlassButton>
  );
}
