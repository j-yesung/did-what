import { useId } from "react";

import {
  type ArrivalLight,
  burstDots,
  circlesPath,
  LIT_LEVELS,
  landDots,
  type Spot,
  toShape,
} from "../../model/dot-map";
import boundaries from "../../model/map-boundaries.json";
import type { Box } from "../../model/map-view";
import styles from "./dot-land.module.css";

const land = boundaries.land.map(toShape);

const LIT_COLORS = Array.from(
  { length: LIT_LEVELS },
  (_, level) =>
    `color-mix(in srgb, var(--journey-glow) ${Math.round(((level + 0.5) / LIT_LEVELS) * 100)}%, var(--journey-ember))`,
);

type DotLandProps = { box: Box; step: number; spots: Spot[]; arrivals: ArrivalLight[] };

export function DotLand({ box, step, spots, arrivals }: DotLandProps) {
  const dots = landDots(land, spots, box, step);
  const levels = LIT_COLORS.map((_, level) => dots.filter((dot) => dot.level === level));
  const bursts = arrivals.flatMap((light) =>
    burstDots(dots, light, step).map((dot) => ({ ...dot, key: `${light.key}:${dot.x},${dot.y}` })),
  );
  const glow = useId();

  return (
    <g>
      <defs>
        <radialGradient id={glow}>
          <stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--journey-gold) 90%, transparent)" }} />
          <stop offset="0.4" style={{ stopColor: "color-mix(in srgb, var(--journey-amber) 35%, transparent)" }} />
          <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--journey-amber) 0%, transparent)" }} />
        </radialGradient>
      </defs>
      {dots.map(
        ({ x, y, level }) =>
          level >= 0 && (
            <circle
              key={`${x},${y}`}
              cx={x}
              cy={y}
              r={step * 1.2}
              fill={`url(#${glow})`}
              opacity={0.2 + level * 0.15}
            />
          ),
      )}
      <path
        className={styles.mutedDots}
        d={circlesPath(
          dots.filter((dot) => dot.level < 0),
          step * 0.3,
        )}
      />
      {levels.map((group, level) => (
        <path key={LIT_COLORS[level]} d={circlesPath(group, step * 0.3)} style={{ fill: LIT_COLORS[level] }} />
      ))}
      {bursts.map(({ key, x, y }) => (
        <g key={key} className={styles.burst}>
          <circle cx={x} cy={y} r={step * 0.3} />
          <circle cx={x} cy={y} r={step * 0.3} strokeWidth={step * 0.08} />
        </g>
      ))}
    </g>
  );
}
