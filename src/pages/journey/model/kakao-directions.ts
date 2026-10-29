import type { JourneyRoute, JourneyPoint as Point } from "./types";

type ObjectValue = Record<string, unknown>;

const isObject = (value: unknown): value is ObjectValue => typeof value === "object" && value !== null;
const isNonnegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export const parseKakaoDirections = (data: unknown): JourneyRoute | null => {
  if (!isObject(data) || !Array.isArray(data.routes)) return null;

  const route = data.routes[0];
  if (!isObject(route) || route.result_code !== 0 || !isObject(route.summary) || !Array.isArray(route.sections)) {
    return null;
  }

  const { distance, duration } = route.summary;
  if (!isNonnegativeNumber(distance) || !isNonnegativeNumber(duration)) return null;

  const points: [number, number][] = [];
  for (const section of route.sections) {
    if (!isObject(section) || !Array.isArray(section.roads)) return null;
    for (const road of section.roads) {
      if (!isObject(road) || !Array.isArray(road.vertexes) || road.vertexes.length % 2 !== 0) return null;
      for (let index = 0; index < road.vertexes.length; index += 2) {
        const longitude: unknown = road.vertexes[index];
        const latitude: unknown = road.vertexes[index + 1];
        if (
          typeof longitude !== "number" ||
          !Number.isFinite(longitude) ||
          typeof latitude !== "number" ||
          !Number.isFinite(latitude)
        )
          return null;
        points.push([longitude, latitude]);
      }
    }
  }

  return points.length >= 2 ? { points, distance, duration } : null;
};

export const hasNoKakaoRoute = (data: unknown) => {
  const route = isObject(data) && Array.isArray(data.routes) ? data.routes[0] : null;
  return isObject(route) && typeof route.result_code === "number" && route.result_code !== 0;
};

export const nearbyRoute = (origin: Point, destination: Point): JourneyRoute | null => {
  const radians = Math.PI / 180;
  const x =
    (destination.longitude - origin.longitude) *
    radians *
    Math.cos(((origin.latitude + destination.latitude) * radians) / 2);
  const y = (destination.latitude - origin.latitude) * radians;
  if (Math.hypot(x, y) * 6_371_000 > 10) return null;

  return {
    points: [
      [origin.longitude, origin.latitude],
      [destination.longitude, destination.latitude],
    ] as [number, number][],
    distance: 0,
    duration: 0,
  };
};

const roundCoordinate = (value: number) => Math.round(value * 1000) / 1000;

export const straightHomeRoute = (home: Point, destination: Point): JourneyRoute => ({
  points: [
    [roundCoordinate(home.longitude), roundCoordinate(home.latitude)],
    [destination.longitude, destination.latitude],
  ] as [number, number][],
  distance: 0,
  duration: 0,
  straight: true,
});

const METERS_PER_DEGREE = 111_320;

const distanceToSegment = ([x, y]: number[], [startX, startY]: number[], [endX, endY]: number[]) => {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((x - startX) * dx + (y - startY) * dy) / length)) : 0;

  return Math.hypot(x - startX - t * dx, y - startY - t * dy);
};

export const simplifyRoutePoints = (points: [number, number][], toleranceMeters = 3) => {
  if (points.length <= 2) return points;

  const scale = Math.cos((points[0][1] * Math.PI) / 180) * METERS_PER_DEGREE;
  const meters = points.map(([longitude, latitude]) => [longitude * scale, latitude * METERS_PER_DEGREE]);
  const keep = new Set([0, points.length - 1]);
  const ranges = [[0, points.length - 1]];
  while (ranges.length) {
    const [start, end] = ranges.pop()!;
    let farthest = -1;
    let distance = toleranceMeters;
    for (let index = start + 1; index < end; index++) {
      const next = distanceToSegment(meters[index], meters[start], meters[end]);
      if (next > distance) {
        farthest = index;
        distance = next;
      }
    }
    if (farthest < 0) continue;

    keep.add(farthest);
    ranges.push([start, farthest], [farthest, end]);
  }

  return points.filter((_, index) => keep.has(index));
};
