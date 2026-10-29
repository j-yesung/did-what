import type { MouseEvent } from "react";

import { type Box, pinAt, placeLabels, project } from "../../model/map-view";
import type { JourneyPlace } from "../../model/types";
import styles from "../journey-map.module.css";

type PlaceLabelsProps = {
  places: JourneyPlace[];
  view: Box;
  unit: number;
  viewportWidth: number;
  settled: { view: Box; unit: number };
  canTap: (event: MouseEvent) => boolean;
  onFocus: (place: JourneyPlace) => void;
  onChoose: (places: JourneyPlace[]) => void;
};

export function PlaceLabels({
  places,
  view,
  unit,
  viewportWidth,
  settled,
  canTap,
  onFocus,
  onChoose,
}: PlaceLabelsProps) {
  const open = (group: JourneyPlace[]) => (group.length === 1 ? onFocus(group[0]) : onChoose(group));

  return (
    <>
      {placeLabels(places, view, unit, viewportWidth, settled).map((label) => (
        <g
          key={label.key}
          role="button"
          tabIndex={0}
          className={`${styles.placeLabel} ${styles.pinned}`}
          style={pinAt(project(label.places[0].longitude, label.places[0].latitude))}
          aria-label={
            label.places.length > 1
              ? `${label.places[0].name} 외 ${label.places.length - 1}곳 보기`
              : `${label.places[0].name} 위치 보기`
          }
          onClick={(event) => {
            if (canTap(event)) open(label.places);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            open(label.places);
          }}
        >
          <rect
            className={styles.labelHit}
            x={label.x}
            y={label.y - 6 * unit}
            width={label.width}
            height={44 * unit}
            rx={22 * unit}
          />
          <rect
            className={styles.labelSurface}
            x={label.x}
            y={label.y}
            width={label.width}
            height={32 * unit}
            rx={16 * unit}
            strokeWidth={unit}
          />
          <text x={label.x + 10 * unit} y={label.y + 21 * unit} fontSize={11 * unit}>
            {label.name}
            {label.places.length > 1 && <tspan className={styles.labelCount}> +{label.places.length - 1}</tspan>}
          </text>
        </g>
      ))}
    </>
  );
}
