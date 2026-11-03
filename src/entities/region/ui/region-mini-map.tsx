import { cn } from "@/shared/lib/utils";

import { KOREA_MAP_CELL_STYLE, type RegionActivityMap } from "../model/korea-map";

type RegionMiniMapProps = {
  className?: string;
  label?: string;
  map: RegionActivityMap;
};

export function RegionMiniMap({ className, label, map }: RegionMiniMapProps) {
  return (
    <svg
      data-slot="region-mini-map"
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
            data-level={cell.level}
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
