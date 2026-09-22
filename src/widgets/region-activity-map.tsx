"use client";

import { useMemo } from "react";

import { createKoreaMap, KOREA_MAP_CELL_STYLE, type KoreaMapCell, type RecordLocation } from "@/entities/region";

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

export function RegionActivityMap({ records }: { records: RecordLocation[] }) {
  const map = useMemo(() => createKoreaMap(records), [records]);

  return (
    <svg
      className="absolute inset-0 size-full overflow-visible px-1.5 py-1 [shape-rendering:geometricPrecision]"
      viewBox={`0 0 ${map.width} ${map.height}`}
      role="img"
      aria-labelledby="korea-map-title korea-map-description"
      preserveAspectRatio="xMidYMid meet"
    >
      <title id="korea-map-title">대한민국 발자취 지도</title>
      <desc id="korea-map-description">
        {records.length > 0
          ? `대한민국을 작은 정사각형 셀로 표현하고 방문 지역 ${records.length}곳을 색상 농도로 표시한 지도`
          : "대한민국을 작은 정사각형 셀로 표현한, 아직 표시할 방문 기록이 없는 지도"}
      </desc>
      <MapCells cells={map.cells} />
    </svg>
  );
}
