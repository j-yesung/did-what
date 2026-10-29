import { memo } from "react";

import boundaries from "../../model/map-boundaries.json";
import { project } from "../../model/map-view";
import styles from "../journey-map.module.css";

const dokdo = [
  { longitude: 131.8697, latitude: 37.2411 },
  { longitude: 131.8636, latitude: 37.2425 },
].map(({ longitude, latitude }) => project(longitude, latitude));

export const MapShapes = memo(function MapShapes() {
  return (
    <g className={styles.land}>
      {boundaries.regions.map((item) => (
        <path key={item.code} d={item.path} />
      ))}
      {dokdo.map((point) => (
        <circle key={point.x} cx={point.x} cy={point.y} r={0.45} />
      ))}
      <path d={boundaries.coast} />
    </g>
  );
});

const DistrictPaths = memo(function DistrictPaths() {
  return (
    <>
      {boundaries.districts.map((path) => (
        <path key={path} d={path} />
      ))}
    </>
  );
});

export function DistrictShapes({ viewWidth }: { viewWidth: number }) {
  return (
    <g
      className={styles.districts}
      display={viewWidth >= 120 ? "none" : undefined}
      opacity={Math.max(0, Math.min(0.65, (120 - viewWidth) / 80))}
    >
      <DistrictPaths />
    </g>
  );
}
