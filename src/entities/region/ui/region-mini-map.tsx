import { cn } from "@/shared/lib/utils";

import { KOREA_MAP_CELL_STYLE, type KoreaMapCell, type RegionActivityMap } from "../model/korea-map";

function MapCells({ cells }: { cells: KoreaMapCell[] }) {
  return (
    <g aria-hidden="true">
      {cells.map((cell) => (
        <rect
          key={cell.id}
          className={`stroke-none ${LEVEL_CLASS_NAMES[cell.level]}`}
          height={KOREA_MAP_CELL_STYLE.size}
          rx={KOREA_MAP_CELL_STYLE.radius}
          width={KOREA_MAP_CELL_STYLE.size}
          x={cell.x}
          y={cell.y}
        />
      ))}
    </g>
  );
}

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
