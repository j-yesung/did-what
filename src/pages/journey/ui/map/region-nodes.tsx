import type { MouseEvent } from "react";

import { pinAt, project } from "../../model/map-view";
import type { JourneyRegion } from "../../model/types";
import styles from "../journey-map.module.css";

export const NODE_HIT_RADIUS = 22;

type RegionNodesProps = {
  regions: JourneyRegion[];
  unit: number;
  canTap: (event: MouseEvent) => boolean;
  onChoose: (region: JourneyRegion, tap?: MouseEvent) => void;
};

export function RegionNodes({ regions, unit, canTap, onChoose }: RegionNodesProps) {
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
          </g>
        );
      })}
    </>
  );
}
