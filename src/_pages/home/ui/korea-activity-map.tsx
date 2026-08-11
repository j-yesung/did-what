import { cn } from "@/lib/utils";

import { createKoreaMap, KOREA_MAP_CELL_STYLE, type RecordLocation } from "../lib/korea-map";
import styles from "./korea-activity-map.module.css";

const LEVEL_CLASS_NAMES = {
  0: styles.levelZero,
  1: styles.levelOne,
  2: styles.levelTwo,
  3: styles.levelThree,
  4: styles.levelFour,
} as const;

export function KoreaActivityMap({ records }: { records: RecordLocation[] }) {
  const map = createKoreaMap(records);

  return (
    <svg
      className={styles.map}
      viewBox={`0 0 ${map.width} ${map.height}`}
      role="img"
      aria-labelledby="korea-map-title korea-map-description"
      preserveAspectRatio="xMidYMid meet"
    >
      <title id="korea-map-title">대한민국 발자취 지도</title>
      <desc id="korea-map-description">
        {records.length > 0
          ? `대한민국을 작은 정사각형 셀로 표현하고 방문 기록 ${records.length}개를 초록색 농도로 표시한 지도`
          : "대한민국을 작은 정사각형 셀로 표현한, 아직 표시할 방문 기록이 없는 지도"}
      </desc>
      <g aria-hidden="true">
        {map.cells.map((cell) => (
          <rect
            key={cell.id}
            className={cn(styles.cell, LEVEL_CLASS_NAMES[cell.level])}
            x={cell.x}
            y={cell.y}
            width={KOREA_MAP_CELL_STYLE.size}
            height={KOREA_MAP_CELL_STYLE.size}
            rx={KOREA_MAP_CELL_STYLE.radius}
            data-level={cell.level}
          />
        ))}
      </g>
    </svg>
  );
}
