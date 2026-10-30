import { memo, useId } from "react";

import { circlesPath, LIT_LEVELS, landDots, nearestDot, type Spot, toShape } from "../../model/dot-map";
import boundaries from "../../model/map-boundaries.json";
import { type Box, project } from "../../model/map-view";
import type { JourneyPoint } from "../../model/types";
import styles from "../journey-map.module.css";

const land = boundaries.land.map(toShape);
const LIT_COLORS = Array.from({ length: LIT_LEVELS }, (_, level) => {
  const t = 0.25 + ((level + 0.5) / LIT_LEVELS) * 0.75;
  return `rgb(${Math.round(170 + 85 * t)} ${Math.round(110 + 120 * t)} ${Math.round(40 + 120 * t * t)})`;
});

export const toSpots = (visits: JourneyPoint[]): Spot[] =>
  visits.map((visit) => ({ ...project(visit.longitude, visit.latitude), weight: 0.5 }));

type DotLandProps = { box: Box; step: number; spots: Spot[]; bursts: (Spot & { key: string })[] };

export const DotLand = memo(function DotLand({ box, step, spots, bursts }: DotLandProps) {
  const dots = landDots(land, spots, box, step);
  const levels = LIT_COLORS.map((_, level) => dots.filter((dot) => dot.level === level));
  const glow = useId();

  return (
    <g>
      <defs>
        <radialGradient id={glow}>
          <stop offset="0" stopColor="rgb(255 214 120 / 0.9)" />
          <stop offset="0.4" stopColor="rgb(255 158 44 / 0.35)" />
          <stop offset="1" stopColor="rgb(255 140 30 / 0)" />
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
        <path key={LIT_COLORS[level]} d={circlesPath(group, step * 0.3)} fill={LIT_COLORS[level]} />
      ))}
      {bursts.map((burst) => {
        const dot = nearestDot(burst, step);
        return (
          <g key={burst.key} className={styles.burst}>
            <circle cx={dot.x} cy={dot.y} r={step * 0.3} />
            <circle cx={dot.x} cy={dot.y} r={step * 0.3} strokeWidth={step * 0.08} />
          </g>
        );
      })}
    </g>
  );
});
