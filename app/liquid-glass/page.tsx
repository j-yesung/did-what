"use client";

import { CalendarCheckIcon } from "@phosphor-icons/react";

import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";

export default function LiquidGlassPage() {
  return (
    <main className="grid min-h-svh place-items-center overflow-hidden bg-[radial-gradient(circle_at_22%_35%,var(--destructive),transparent_30%),radial-gradient(circle_at_72%_65%,var(--primary),transparent_31%),radial-gradient(circle_at_50%_15%,color-mix(in_oklab,var(--primary)_55%,var(--destructive)),transparent_27%),var(--color-dark)] px-6">
      <div className="flex items-center gap-4">
        <LiquidGlassButton>시작하기</LiquidGlassButton>
        <LiquidGlassButton aria-label="캘린더" shape="circle">
          <CalendarCheckIcon data-icon="inline-start" />
        </LiquidGlassButton>
      </div>
    </main>
  );
}
