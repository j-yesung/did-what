import { cn } from "@/shared/lib/utils";

import { KOREA_MAP_CELL_STYLE, KOREA_MAP_DOT_RADIUS, type RegionActivityMap } from "../model/korea-map";

const LEVEL_CLASS_NAMES = {
  1: "fill-map-level-1",
  2: "fill-map-level-2",
  3: "fill-map-level-3",
  4: "fill-map-level-4",
} as const;

const CELL_CENTER = KOREA_MAP_CELL_STYLE.size / 2;

type RegionMiniMapProps = {
  className?: string;
  label?: string;
  map: RegionActivityMap;
};

// 홈 지도와 같은 모양으로, 지역 윤곽 위에 기록이 남은 곳을 점으로 찍는다.
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
      <g aria-hidden="true">
        {/* 경기처럼 가운데가 빈 지역(서울 자리)은 안쪽 고리를 비워야 해서 evenodd로 칠한다. */}
        <path className="fill-map-empty" d={map.path} fillRule="evenodd" />
        {map.cells.map((cell) => {
          if (cell.level === 0) return null;
          return (
            <circle
              className={LEVEL_CLASS_NAMES[cell.level]}
              cx={cell.x + CELL_CENTER}
              cy={cell.y + CELL_CENTER}
              key={cell.id}
              r={KOREA_MAP_DOT_RADIUS[cell.level]}
            />
          );
        })}
      </g>
    </svg>
  );
}
