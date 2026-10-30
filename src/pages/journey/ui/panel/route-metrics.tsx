import { type ReactNode, useEffect, useRef, useState } from "react";

import { getRecordWeatherLabel, normalizeRecordWeather, WeatherIcon } from "@/entities/record";

import { durationParts } from "../../model/duration";
import { prefersReducedMotion, SKETCH_MS } from "../../model/motion";
import type { JourneySegment } from "../../model/types";
import styles from "./route-metrics.module.css";

function AnimatedNumber({
  value,
  format,
  instant = false,
}: {
  value: number;
  format: (value: number) => ReactNode;
  instant?: boolean;
}) {
  const [display, setDisplay] = useState(instant ? value : 0);
  const previous = useRef(instant ? value : 0);

  useEffect(() => {
    const start = previous.current;
    const started = performance.now();
    if (instant || prefersReducedMotion()) {
      setDisplay(value);
      previous.current = value;
      return;
    }

    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / SKETCH_MS);
      const current = start + (value - start) * progress;
      previous.current = current;
      setDisplay(current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, instant]);

  return <>{format(display)}</>;
}

type RouteMetricsProps = { segments: JourneySegment[]; weather?: string; instant?: boolean };

export function RouteMetrics({ segments, weather, instant }: RouteMetricsProps) {
  const distance = segments.reduce((sum, segment) => sum + segment.route.distance, 0);
  const duration = segments.reduce((sum, segment) => sum + segment.route.duration, 0);

  return (
    <div className={styles.metrics}>
      {segments.length > 0 && (
        <>
          <strong>
            <AnimatedNumber value={distance / 1000} format={(value) => value.toFixed(1)} instant={instant} />
            <small> km</small>
          </strong>
          <em>
            <AnimatedNumber
              instant={instant}
              value={duration / 60}
              format={(value) =>
                durationParts(Math.round(value)).map(([amount, unit]) => (
                  <span key={unit}>
                    <b>{amount}</b>
                    {unit}
                  </span>
                ))
              }
            />
          </em>
          {weather && (
            <span className={styles.weather}>
              <WeatherIcon aria-hidden="true" weather={normalizeRecordWeather(weather)} />
              {getRecordWeatherLabel(normalizeRecordWeather(weather))}
            </span>
          )}
        </>
      )}
    </div>
  );
}
