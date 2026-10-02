import { cn } from "@/shared/lib/utils";

import { KOREA_MAP_CELL_STYLE, type RegionActivityMap } from "../model/korea-map";

const LEVEL_CLASS_NAMES = {
  0: "fill-map-empty",
  1: "fill-map-level-1",
  2: "fill-map-level-2",
  3: "fill-map-level-3",
  4: "fill-map-level-4",
} as const;

type RegionMiniMapProps = {
  className?: string;
  label?: string;
  map: RegionActivityMap;
};

// 홈 지도와 같은 둥근 셀과 농도로 지역의 방문 기록을 보여준다.
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
        {map.cells.map((cell) => (
          <rect
            className={LEVEL_CLASS_NAMES[cell.level]}
            height={KOREA_MAP_CELL_STYLE.size}
            key={cell.id}
            rx={KOREA_MAP_CELL_STYLE.radius}
            width={KOREA_MAP_CELL_STYLE.size}
            x={cell.x}
            y={cell.y}
          />
        ))}
      </g>
    </svg>
  );
}
