import type { MouseEvent } from "react";

import { pinAt, project } from "../../model/map-view";
import type { JourneyRegion } from "../../model/types";
import styles from "../journey-map.module.css";

export const NODE_HIT_RADIUS = 22;

type RegionNodesProps = {
  regions: JourneyRegion[];
  unit: number;
  viewWidth: number;
  canTap: (event: MouseEvent) => boolean;
  onChoose: (region: JourneyRegion, tap?: MouseEvent) => void;
};

export function RegionNodes({ regions, unit, viewWidth, canTap, onChoose }: RegionNodesProps) {
  const labelOpacity = Math.max(0, Math.min(1, (150 - viewWidth) / 40));

  return (
    <>
      {regions.map((item) => {
        const point = project(item.longitude, item.latitude);
        return (
          <g
            key={item.code}
            role="button"
            tabIndex={0}
            aria-label={`${item.name} 기록 ${item.count}개`}
            className={`${styles.node} ${styles.pinned}`}
            style={pinAt(point)}
            onClick={(event) => {
              if (canTap(event)) onChoose(item, event);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onChoose(item);
            }}
          >
            <circle cx={point.x} cy={point.y} r={unit * NODE_HIT_RADIUS} fill="transparent" />
            <circle cx={point.x} cy={point.y} r={unit * 7} className={styles.halo} />
            <circle cx={point.x} cy={point.y} r={unit * 3.5} className={styles.previous} />
            {labelOpacity > 0 && (
              <text
                aria-hidden="true"
                className={styles.label}
                fontSize={unit * 11}
                opacity={labelOpacity}
                strokeWidth={unit * 3}
                x={point.x + unit * 10}
                y={point.y + unit * 4}
              >
                {item.name}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}
