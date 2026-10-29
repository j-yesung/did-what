import { useMemo } from "react";

import { HouseIcon } from "@phosphor-icons/react";

import { project } from "../../model/map-view";
import type { JourneyPlace, JourneySegment } from "../../model/types";
import styles from "../journey-map.module.css";

function SegmentPath({ segment, drawing, unit }: { segment: JourneySegment; drawing: boolean; unit: number }) {
  const path = useMemo(
    () =>
      [
        ...(segment.from ? [segment.from] : []),
        ...segment.route.points.map(([longitude, latitude]) => ({ longitude, latitude })),
        segment.to,
      ]
        .map(({ longitude, latitude }, index) => {
          const point = project(longitude, latitude);
          return `${index ? "L" : "M"}${point.x},${point.y}`;
        })
        .join(""),
    [segment],
  );

  return (
    <path
      className={`${styles.route} ${drawing ? styles.drawing : ""}`}
      d={path}
      pathLength={1}
      strokeWidth={unit * 2.5}
    />
  );
}

type RouteLayerProps = {
  segments: JourneySegment[];
  complete: JourneySegment[];
  drawing: boolean;
  highlight: { place: JourneyPlace; key: number } | null;
  unit: number;
};

export function RouteLayer({ segments, complete, drawing, highlight, unit }: RouteLayerProps) {
  const start = segments[0]?.route.points[0];
  const startPoint = start ? project(start[0], start[1]) : null;
  const highlightPoint = highlight ? project(highlight.place.longitude, highlight.place.latitude) : null;

  return (
    <>
      {segments.map((segment, index) => (
        <SegmentPath
          key={segment.key}
          segment={segment}
          unit={unit}
          drawing={drawing && index === segments.length - 1}
        />
      ))}
      {startPoint && <circle cx={startPoint.x} cy={startPoint.y} r={unit * 4.5} className={styles.visited} />}
      {complete.map((segment, index) => {
        const point = project(segment.to.longitude, segment.to.latitude);
        const isCurrent = index === complete.length - 1 && !drawing;
        return (
          <g key={`point-${segment.key}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r={unit * (isCurrent ? 3.5 : 4.5)}
              className={isCurrent ? styles.arrival : styles.visited}
            />
            {isCurrent && <circle cx={point.x} cy={point.y} r={unit * 9} strokeWidth={unit} className={styles.pulse} />}
          </g>
        );
      })}
      {highlight && highlightPoint && (
        <circle
          key={highlight.key}
          className={styles.focusRing}
          cx={highlightPoint.x}
          cy={highlightPoint.y}
          r={unit * 9}
          strokeWidth={unit * 1.5}
        />
      )}
      {startPoint && (
        <HouseIcon
          aria-label="내 집"
          className={styles.homeIcon}
          size={unit * 14}
          weight="fill"
          x={startPoint.x - unit * 7}
          y={startPoint.y - unit * 22}
        />
      )}
    </>
  );
}
