import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { GpsFixIcon } from "@phosphor-icons/react";

import { ICON_WEIGHT_MEDIUM } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { Spinner } from "@/shared/ui/spinner";
import type { useCurrentMapLocation } from "@/widgets/region-activity-map/model/use-current-map-location";

type MapControlsProps = {
  currentLocation: ReturnType<typeof useCurrentMapLocation>;
};

export function MapControls({ currentLocation }: MapControlsProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 본문의 전환 효과에 transform이 있어도 툴바와 같은 화면 위치를 유지한다.
  const layer = (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--page-top)+var(--toolbar-height)+20px)] z-30">
      <div
        className={cn("mx-auto flex w-full max-w-(--app-width) justify-end px-5", ICON_WEIGHT_MEDIUM)}
        role="group"
        aria-label="지도 조작"
      >
        <div className="pointer-events-auto">
          {/* 위치 확인은 최대 10초가 걸린다. 흐리게만 두면 고장 난 버튼처럼 보여 진행 표시로 바꾼다. */}
          <LiquidGlassButton
            aria-busy={currentLocation.isPending || undefined}
            aria-label="현재 위치 표시"
            shape="circle"
            title="현재 위치 표시"
            onClick={() => {
              if (!currentLocation.isPending) currentLocation.locate();
            }}
          >
            {currentLocation.isPending ? <Spinner aria-hidden="true" /> : <GpsFixIcon aria-hidden="true" />}
          </LiquidGlassButton>
        </div>
        <span className="sr-only" role="status">
          {currentLocation.isPending
            ? "현재 위치를 확인하고 있어요."
            : currentLocation.position
              ? "현재 위치가 지도에 표시됐어요."
              : ""}
        </span>
      </div>
    </div>
  );

  return mounted ? createPortal(layer, document.body) : layer;
}
