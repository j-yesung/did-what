import { useEffectEvent, useLayoutEffect, useMemo, useRef } from "react";

import { HouseIcon } from "@phosphor-icons/react";

import { partialPathData, pathLengths, pinAt, project, toPathData } from "../../model/map-view";
import { prefersReducedMotion, SKETCH_MS } from "../../model/motion";
import type { JourneyPlace, JourneySegment } from "../../model/types";
import styles from "../journey-map.module.css";

type SegmentPathProps = {
  segment: JourneySegment;
  drawing: boolean;
  unit: number;
  onSketchEnd: () => void;
};

function SegmentPath({ segment, drawing, unit, onSketchEnd }: SegmentPathProps) {
  const points = useMemo(
    () =>
      [
        ...(segment.from ? [segment.from] : []),
        ...segment.route.points.map(([longitude, latitude]) => ({ longitude, latitude })),
        segment.to,
      ].map(({ longitude, latitude }) => project(longitude, latitude)),
    [segment],
  );
  const path = useMemo(() => toPathData(points), [points]);
  const element = useRef<SVGPathElement>(null);
  const finishSketch = useEffectEvent(onSketchEnd);

  useLayoutEffect(() => {
    const target = element.current;
    if (!drawing || !target || prefersReducedMotion()) return;

    const lengths = pathLengths(points);
    const total = lengths.at(-1) ?? 0;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, Math.max(0, now - started) / SKETCH_MS);
      target.setAttribute("d", partialPathData(points, lengths, total * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else finishSketch();
    };
    tick(started);
    return () => {
      cancelAnimationFrame(frame);
      target.setAttribute("d", path);
    };
  }, [drawing, points, path]);

  return <path ref={element} className={styles.route} d={path} strokeWidth={unit * 2.5} />;
}

type RouteLayerProps = {
  segments: JourneySegment[];
  complete: JourneySegment[];
  drawing: boolean;
  highlight: { place: JourneyPlace; key: number } | null;
  unit: number;
  onSketchEnd: () => void;
};

export function RouteLayer({ segments, complete, drawing, highlight, unit, onSketchEnd }: RouteLayerProps) {
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
          onSketchEnd={onSketchEnd}
        />
      ))}
      {startPoint && (
        <g className={styles.pinned} style={pinAt(startPoint)}>
          <circle cx={startPoint.x} cy={startPoint.y} r={unit * 4.5} className={styles.visited} />
        </g>
      )}
      {complete.map((segment, index) => {
        const point = project(segment.to.longitude, segment.to.latitude);
        const isCurrent = index === complete.length - 1 && !drawing;
        return (
          <g key={`point-${segment.key}`} className={styles.pinned} style={pinAt(point)}>
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
        <g className={styles.pinned} style={pinAt(highlightPoint)}>
          <circle
            key={highlight.key}
            className={styles.focusRing}
            cx={highlightPoint.x}
            cy={highlightPoint.y}
            r={unit * 9}
            strokeWidth={unit * 1.5}
          />
        </g>
      )}
      {startPoint && (
        <g className={styles.pinned} style={pinAt(startPoint)}>
          <HouseIcon
            aria-label="내 집"
            className={styles.homeIcon}
            size={unit * 14}
            weight="fill"
            x={startPoint.x - unit * 7}
            y={startPoint.y - unit * 22}
          />
        </g>
      )}
    </>
  );
}
