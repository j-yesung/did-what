import type { CSSProperties } from "react";

import { pinAt } from "../../model/map-view";
import styles from "../journey-map.module.css";

const COLORS = ["rgb(255 214 120)", "rgb(255 158 44)", "var(--journey-white)", "var(--journey-sky)"];

const SPARKS = Array.from({ length: 18 }, (_, index) => {
  const angle = (index / 18) * Math.PI * 2 + (index % 2) * 0.17;
  const reach = index % 2 ? 0.6 : 1;
  return { x: Math.cos(angle) * reach, y: Math.sin(angle) * reach, reach, color: COLORS[index % COLORS.length] };
});

type FireworksProps = { point: { x: number; y: number }; unit: number };

export function Fireworks({ point, unit }: FireworksProps) {
  return (
    <g className={`${styles.pinned} ${styles.fireworks}`} style={pinAt(point)} aria-hidden="true">
      <circle className={styles.fireworkFlash} cx={point.x} cy={point.y} r={unit * 10} />
      {SPARKS.map((spark) => (
        <circle
          key={`${spark.x},${spark.y}`}
          className={styles.spark}
          cx={point.x}
          cy={point.y}
          r={unit * (spark.reach > 0.8 ? 3.2 : 2.4)}
          style={
            {
              fill: spark.color,
              "--dx": spark.x * unit * 64,
              "--dy": spark.y * unit * 64,
              "--fall": unit * 18,
            } as CSSProperties
          }
        />
      ))}
    </g>
  );
}
