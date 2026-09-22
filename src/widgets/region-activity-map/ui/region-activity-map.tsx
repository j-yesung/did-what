"use client";

import { memo, useMemo } from "react";

import { createKoreaMap, KOREA_MAP_CELL_STYLE, type KoreaMapCell, type RecordLocation } from "@/entities/region";
import { cn } from "@/shared/lib/utils";
import { useCurrentMapLocation } from "@/widgets/region-activity-map/model/use-current-map-location";
import { useMapViewport } from "@/widgets/region-activity-map/model/use-map-viewport";
import { MapControls } from "@/widgets/region-activity-map/ui/map-controls";

const LEVEL_CLASS_NAMES = {
  0: "fill-map-empty",
  1: "fill-map-level-1",
  2: "fill-map-level-2",
  3: "fill-map-level-3",
  4: "fill-map-level-4",
} as const;

const MapCells = memo(function MapCells({ cells }: { cells: KoreaMapCell[] }) {
  return (
    <g aria-hidden="true">
      {cells.map((cell) => (
        <rect
          key={cell.id}
          className={`stroke-none ${LEVEL_CLASS_NAMES[cell.level]}`}
          x={cell.x}
          y={cell.y}
          width={KOREA_MAP_CELL_STYLE.size}
          height={KOREA_MAP_CELL_STYLE.size}
          rx={KOREA_MAP_CELL_STYLE.radius}
          data-level={cell.level}
        />
      ))}
    </g>
  );
});

export function RegionActivityMap({ records }: { records: RecordLocation[] }) {
  const map = useMemo(() => createKoreaMap(records), [records]);
  const viewport = useMapViewport(map);
  const currentLocation = useCurrentMapLocation(viewport.focusOn);

  return (
    <>
      <svg
        className={cn(
          "absolute inset-0 size-full touch-none overflow-hidden px-1.5 py-1 [shape-rendering:geometricPrecision]",
          viewport.zoom > 1 && "cursor-grab active:cursor-grabbing",
        )}
        role="img"
        aria-labelledby="korea-map-title korea-map-description"
        preserveAspectRatio="xMidYMid meet"
        {...viewport.svgProps}
      >
        <title id="korea-map-title">대한민국 발자취 지도</title>
        <desc id="korea-map-description">
          {records.length > 0
            ? `대한민국을 작은 정사각형 셀로 표현하고 방문 지역 ${records.length}곳을 색상 농도로 표시한 지도.`
            : "대한민국을 작은 정사각형 셀로 표현한, 아직 표시할 방문 기록이 없는 지도."}
          두 손가락으로 확대하거나 축소하고, 확대된 지도는 한 손가락으로 이동할 수 있어요.
          {currentLocation.position ? "현재 위치가 원형 점으로 표시되어 있어요." : ""}
        </desc>
        <MapCells cells={map.cells} />
        {currentLocation.position ? (
          <g aria-label="현재 위치">
            <circle
              cx={currentLocation.position.x}
              cy={currentLocation.position.y}
              r={10 / viewport.zoom}
              className="fill-primary/15"
            />
            <circle
              cx={currentLocation.position.x}
              cy={currentLocation.position.y}
              r={4 / viewport.zoom}
              className="fill-primary stroke-background"
              strokeWidth={2 / viewport.zoom}
            />
          </g>
        ) : null}
      </svg>
      <MapControls viewport={viewport} currentLocation={currentLocation} />
    </>
  );
}
