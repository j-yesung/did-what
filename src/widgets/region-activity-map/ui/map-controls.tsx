import { ArrowsInSimpleIcon, GpsFixIcon } from "@phosphor-icons/react";

import { ICON_WEIGHT_MEDIUM } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { LiquidGlassButton, type LiquidGlassButtonProps } from "@/shared/ui/liquid-glass-button";
import { Spinner } from "@/shared/ui/spinner";
import type { useCurrentMapLocation } from "@/widgets/region-activity-map/model/use-current-map-location";
import type { useMapViewport } from "@/widgets/region-activity-map/model/use-map-viewport";

type MapControlsProps = {
  viewport: Pick<ReturnType<typeof useMapViewport>, "canReset" | "reset">;
  currentLocation: ReturnType<typeof useCurrentMapLocation>;
};

type MapControlButtonProps = Omit<LiquidGlassButtonProps, "aria-label" | "shape" | "title"> & { label: string };

function MapControlButton({ label, ...props }: MapControlButtonProps) {
  return <LiquidGlassButton aria-label={label} shape="circle" title={label} {...props} />;
}

export function MapControls({ viewport, currentLocation }: MapControlsProps) {
  return (
    <div
      className={cn(
        "absolute top-[calc(var(--page-top)+var(--toolbar-height)+32px)] right-5 flex flex-col items-center gap-3",
        ICON_WEIGHT_MEDIUM,
      )}
      role="group"
      aria-label="지도 조작"
    >
      {/* 위치 확인은 최대 10초가 걸린다. 흐리게만 두면 고장 난 버튼처럼 보여 진행 표시로 바꾼다. */}
      <MapControlButton
        aria-busy={currentLocation.isPending || undefined}
        label="현재 위치로 이동"
        onClick={() => {
          if (!currentLocation.isPending) currentLocation.locate();
        }}
      >
        {currentLocation.isPending ? <Spinner aria-hidden="true" /> : <GpsFixIcon aria-hidden="true" />}
      </MapControlButton>
      <MapControlButton disabled={!viewport.canReset} label="처음 지도로 복귀" onClick={viewport.reset}>
        <ArrowsInSimpleIcon aria-hidden="true" />
      </MapControlButton>
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
