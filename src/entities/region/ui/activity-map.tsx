"use client";

import { useMemo } from "react";

import { cn } from "@/shared/lib/utils";

import {
  createKoreaMap,
  KOREA_MAP_CELL_STYLE,
  type KoreaMapCell,
  type RecordLocation,
  type RegionActivityMap,
} from "../model/korea-map";

const LEVEL_CLASS_NAMES = {
  0: "fill-map-empty",
  1: "fill-map-level-1",
  2: "fill-map-level-2",
  3: "fill-map-level-3",
  4: "fill-map-level-4",
} as const;

function MapCells({ cells }: { cells: KoreaMapCell[] }) {
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
}

export function KoreaActivityMap({ records }: { records: RecordLocation[] }) {
  const map = useMemo(() => createKoreaMap(records), [records]);

  return (
    <svg
      className="h-full w-full overflow-visible [shape-rendering:geometricPrecision]"
      viewBox={`0 0 ${map.width} ${map.height}`}
      role="img"
      aria-labelledby="korea-map-title korea-map-description"
      preserveAspectRatio="xMidYMid meet"
    >
      <title id="korea-map-title">대한민국 발자취 지도</title>
      <desc id="korea-map-description">
        {records.length > 0
          ? `대한민국을 작은 정사각형 셀로 표현하고 방문 기록 ${records.length}개를 색상 농도로 표시한 지도`
          : "대한민국을 작은 정사각형 셀로 표현한, 아직 표시할 방문 기록이 없는 지도"}
      </desc>
      <MapCells cells={map.cells} />
    </svg>
  );
}

type RegionMiniMapProps = {
  className?: string;
  label?: string;
  map: RegionActivityMap;
};

export function RegionMiniMap({ className, label, map }: RegionMiniMapProps) {
  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn("h-full w-full overflow-visible [shape-rendering:geometricPrecision]", className)}
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      role={label ? "img" : undefined}
      viewBox={`0 0 ${map.width} ${map.height}`}
    >
      <MapCells cells={map.cells} />
    </svg>
  );
}
