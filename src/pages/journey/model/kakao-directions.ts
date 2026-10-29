type ObjectValue = Record<string, unknown>;
const isObject = (value: unknown): value is ObjectValue => typeof value === "object" && value !== null;
const isNonnegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export const parseKakaoDirections = (data: unknown) => {
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

type Point = { latitude: number; longitude: number };
const roundCoordinate = (value: number) => Math.round(value * 1000) / 1000;

export const straightHomeRoute = (home: Point, destination: Point) => ({
  points: [
    [roundCoordinate(home.longitude), roundCoordinate(home.latitude)],
    [destination.longitude, destination.latitude],
  ] as [number, number][],
  distance: 0,
  duration: 0,
  straight: true,
});
