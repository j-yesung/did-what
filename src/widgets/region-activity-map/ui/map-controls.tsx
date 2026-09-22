import { ArrowsInSimpleIcon, CrosshairIcon } from "@phosphor-icons/react";

import { ICON_WEIGHT_MEDIUM } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { PressScale } from "@/shared/ui/press-scale";
import type { useCurrentMapLocation } from "@/widgets/region-activity-map/model/use-current-map-location";
import type { useMapViewport } from "@/widgets/region-activity-map/model/use-map-viewport";

type MapControlsProps = {
  viewport: Pick<ReturnType<typeof useMapViewport>, "canZoomOut" | "reset">;
  currentLocation: ReturnType<typeof useCurrentMapLocation>;
};

export function MapControls({ viewport, currentLocation }: MapControlsProps) {
  return (
    <div
      className={cn(
        "absolute top-[calc(56px+env(safe-area-inset-top)+var(--toolbar-height))] right-2 flex flex-col items-center gap-3",
        ICON_WEIGHT_MEDIUM,
      )}
      role="group"
      aria-label="지도 조작"
    >
      <PressScale className="has-disabled:pointer-events-none">
        <LiquidGlassButton
          aria-label="현재 위치로 이동"
          title="현재 위치로 이동"
          shape="circle"
          disabled={currentLocation.isPending}
          onClick={currentLocation.locate}
        >
          <CrosshairIcon aria-hidden="true" weight="regular" />
        </LiquidGlassButton>
      </PressScale>
      <PressScale className="has-disabled:pointer-events-none">
        <LiquidGlassButton
          aria-label="전체 지도로 복귀"
          title="전체 지도로 복귀"
          shape="circle"
          disabled={!viewport.canZoomOut}
          onClick={viewport.reset}
        >
          <ArrowsInSimpleIcon aria-hidden="true" weight="regular" />
        </LiquidGlassButton>
      </PressScale>
      <span className="sr-only" role="status">
        {currentLocation.isPending
          ? "현재 위치를 확인하고 있어요."
          : currentLocation.position
            ? "현재 위치가 지도에 표시됐어요."
            : ""}
      </span>
    </div>
  );
}
