import { cn } from "@/lib/utils";

import { createKoreaMap, KOREA_MAP_CELL_STYLE } from "../lib/korea-map";
import { MOCK_RECORD_LOCATIONS } from "../model/mock-record-locations";
import styles from "./korea-activity-map.module.css";

const KOREA_MAP = createKoreaMap(MOCK_RECORD_LOCATIONS);
const LEVEL_CLASS_NAMES = {
  0: styles.levelZero,
  1: styles.levelOne,
  2: styles.levelTwo,
  3: styles.levelThree,
  4: styles.levelFour,
} as const;

export function KoreaActivityMap() {
  return (
    <svg
      className={styles.map}
      viewBox={`0 0 ${KOREA_MAP.width} ${KOREA_MAP.height}`}
      role="img"
      aria-labelledby="korea-map-title korea-map-description"
      preserveAspectRatio="xMidYMid meet"
    >
      <title id="korea-map-title">대한민국 발자취 지도</title>
      <desc id="korea-map-description">
        대한민국을 작은 정사각형 셀로 표현하고 서울, 목포, 부산, 제주 방문 기록을 초록색 농도로 표시한 지도
      </desc>
      <g aria-hidden="true">
        {KOREA_MAP.cells.map((cell) => (
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
