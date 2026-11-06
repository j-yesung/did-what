import { useId, useMemo } from "react";

import { circlesPath, dotStep, LIT_LEVELS, landDots, national, toShape, toSpot } from "../model/dot-map";
import boundaries from "../model/map-boundaries.json";
import styles from "./dot-land.module.css";

const land = boundaries.land.map(toShape);

const LIT_COLORS = Array.from(
  { length: LIT_LEVELS },
  (_, level) =>
    `color-mix(in srgb, var(--journey-glow) ${Math.round(((level + 0.5) / LIT_LEVELS) * 100)}%, var(--journey-ember))`,
);

type DotLandMapProps = {
  className?: string;
  label: string;
  visits: readonly { latitude: number; longitude: number }[];
  /** 그려질 폭(px). 기존 지도처럼 화면에서의 점 간격을 맞추는 데 쓴다. */
  width: number;
};

export function DotLandMap({ className, label, visits, width }: DotLandMapProps) {
  const step = dotStep(national.width / width);
  const dots = useMemo(() => landDots(land, visits.map(toSpot), national, step), [visits, step]);
  const glow = useId();

  return (
    <svg
      aria-label={label}
      className={className}
      role="img"
      viewBox={`${national.x} ${national.y} ${national.width} ${national.height}`}
    >
      <defs>
        <radialGradient id={glow}>
          <stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--journey-gold) 90%, transparent)" }} />
          <stop offset="0.4" style={{ stopColor: "color-mix(in srgb, var(--journey-amber) 35%, transparent)" }} />
          <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--journey-amber) 0%, transparent)" }} />
        </radialGradient>
      </defs>
      <g className={styles.halo}>
        {dots.map(
          ({ x, y, level }) =>
            level >= 0 && (
              <circle
                cx={x}
                cy={y}
                fill={`url(#${glow})`}
                key={`${x},${y}`}
                opacity={0.2 + level * 0.15}
                r={step * 1.2}
              />
            ),
        )}
      </g>
      <path
        className={styles.mutedDots}
        d={circlesPath(
          dots.filter((dot) => dot.level < 0),
          step * 0.3,
        )}
      />
      {LIT_COLORS.map((color, level) => (
        <path
          d={circlesPath(
            dots.filter((dot) => dot.level === level),
            step * 0.3,
          )}
          key={color}
          style={{ fill: color }}
        />
      ))}
    </svg>
  );
}
