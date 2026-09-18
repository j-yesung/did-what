"use client";

import { MapPinAreaIcon, SquaresFourIcon } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";

import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { PressLink } from "@/shared/ui/press-link";
import { PressScale } from "@/shared/ui/press-scale";

export function MapViewToggle() {
  const pathname = usePathname();
  const showRegions = pathname === "/";

  return (
    <PressScale className="pointer-events-auto inline-flex">
      <LiquidGlassButton
        aria-label={showRegions ? "지역" : "지도"}
        nativeButton={false}
        render={<PressLink href={showRegions ? "/regions" : "/"} prefetch />}
        shape="circle"
      >
        {showRegions ? <SquaresFourIcon data-icon="inline-start" /> : <MapPinAreaIcon data-icon="inline-start" />}
      </LiquidGlassButton>
    </PressScale>
  );
}
