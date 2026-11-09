import koreaAdm1 from "./korea-adm1.geo.json" with { type: "json" };
import { getRegion, getRegionCode, REGIONS, type Region, type RegionCode } from "./region.ts";

export type ActivityLevel = 0 | 1 | 2 | 3 | 4;

export type RecordLocation = {
  id: string;
  latitude: number;
  longitude: number;
};

export type RegionRecordLocation = RecordLocation & {
  administrativeCode: string;
};

export type KoreaMapCell = {
  id: string;
  x: number;
  y: number;
  latitude: number;
  longitude: number;
  count: number;
  level: ActivityLevel;
  regionCode: RegionCode;
};

type Position = [number, number];
type PolygonCoordinates = Position[][];
type Geometry =
  | { type: "Polygon"; coordinates: PolygonCoordinates }
  | { type: "MultiPolygon"; coordinates: PolygonCoordinates[] };
type BoundaryFeature = {
  properties: { shapeISO: string };
  geometry: Geometry;
};

export type KoreaMapGrid = {
  cells: KoreaMapCell[];
  columns: number;
  rows: number;
  width: number;
  height: number;
};

export type RegionActivityMap = Region & {
  cells: KoreaMapCell[];
  height: number;
  path: string;
  totalCount: number;
  visitedCount: number;
  width: number;
};

const BOUNDARIES = koreaAdm1.features as unknown as BoundaryFeature[];
const REGION_GRID_MAX_COLUMNS = 32;
const REGION_GRID_MIN_COLUMNS = 11;
const CELL_SIZE = 4.4;
const CELL_GAP = 1.1;
const CELL_PITCH = CELL_SIZE + CELL_GAP;
const LONGITUDE_SCALE = Math.cos((36 * Math.PI) / 180);

export const KOREA_MAP_CELL_STYLE = {
  size: CELL_SIZE,
  gap: CELL_GAP,
  radius: 1.2,
} as const;

export const getActivityLevel = (count: number): ActivityLevel => {
  if (count >= 7) return 4;
  if (count >= 4) return 3;
  if (count >= 2) return 2;
  if (count >= 1) return 1;
  return 0;
};

const isPointInRing = ([x, y]: Position, ring: Position[]) => {
  let inside = false;

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [currentX, currentY] = ring[index];
    const [previousX, previousY] = ring[previous];
    const crosses = currentY > y !== previousY > y;

    if (crosses && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX) {
      inside = !inside;
    }
  }

  return inside;
};

const isPointInPolygon = (point: Position, [outerRing, ...holes]: PolygonCoordinates) => {
  return isPointInRing(point, outerRing) && !holes.some((hole) => isPointInRing(point, hole));
};

const containsPoint = (geometry: Geometry, point: Position) => {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some((polygon) => isPointInPolygon(point, polygon));
};

const toPathData = (polygon: PolygonCoordinates, project: (position: Position) => { x: number; y: number }) =>
  polygon
    .map(
      (ring) =>
        `M${ring
          .map((position) => {
            const { x, y } = project(position);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join("L")}Z`,
    )
    .join("");

const getBoundaryRegionCode = (value: string): RegionCode | null => {
  return getRegion(value)?.code ?? null;
};

const getBounds = (geometries: Geometry[]) => {
  let minLongitude = Number.POSITIVE_INFINITY;
  let maxLongitude = Number.NEGATIVE_INFINITY;
  let minLatitude = Number.POSITIVE_INFINITY;
  let maxLatitude = Number.NEGATIVE_INFINITY;

  const include = ([longitude, latitude]: Position) => {
    minLongitude = Math.min(minLongitude, longitude);
    maxLongitude = Math.max(maxLongitude, longitude);
    minLatitude = Math.min(minLatitude, latitude);
    maxLatitude = Math.max(maxLatitude, latitude);
  };

  for (const geometry of geometries) {
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    for (const polygon of polygons) for (const ring of polygon) for (const position of ring) include(position);
  }

  return { minLongitude, maxLongitude, minLatitude, maxLatitude };
};

/**
 * 가장 큰 땅에서 멀리 떨어진 작은 섬은 지역 지도 틀에서 뺀다. 울릉도나 경계 데이터에 경기로 잘못 든 백령도·연평도까지
 * 틀에 넣으면 본토가 한쪽으로 쪼그라든다. 그 섬의 기록은 가장 가까운 칸에 모인다.
 */
const REGION_ISLAND_MARGIN = 0.3;

const getMainlandPolygons = (geometries: Geometry[]) => {
  const polygons = geometries.flatMap((geometry) =>
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates,
  );
  const boundsOf = (polygon: PolygonCoordinates) => getBounds([{ type: "Polygon", coordinates: polygon }]);
  const area = ({ maxLatitude, maxLongitude, minLatitude, minLongitude }: ReturnType<typeof boundsOf>) =>
    (maxLongitude - minLongitude) * (maxLatitude - minLatitude);
  const main = polygons.map(boundsOf).reduce((largest, bounds) => (area(bounds) > area(largest) ? bounds : largest));

  return polygons.filter((polygon) => {
    const bounds = boundsOf(polygon);
    return (
      bounds.maxLongitude >= main.minLongitude - REGION_ISLAND_MARGIN &&
      bounds.minLongitude <= main.maxLongitude + REGION_ISLAND_MARGIN &&
      bounds.maxLatitude >= main.minLatitude - REGION_ISLAND_MARGIN &&
      bounds.minLatitude <= main.maxLatitude + REGION_ISLAND_MARGIN
    );
  });
};

// 지역 지도는 본토 윤곽에 맞는 틀 안에 셀을 채운다.
const generateRegionCells = (regionCode: RegionCode): KoreaMapGrid & { path: string } => {
  const regionGeometries = BOUNDARIES.filter(
    ({ properties }) => getBoundaryRegionCode(properties.shapeISO) === regionCode,
  ).map(({ geometry }) => geometry);
  if (regionGeometries.length === 0) return { cells: [], columns: 0, height: 0, path: "", rows: 0, width: 0 };
  const polygons = getMainlandPolygons(regionGeometries);
  const geometries: Geometry[] = [{ type: "MultiPolygon", coordinates: polygons }];

  const bounds = getBounds(geometries);
  const minimumCellCount = getRegion(regionCode)?.subdivisionCount ?? 1;
  const projectedWidth = (bounds.maxLongitude - bounds.minLongitude) * LONGITUDE_SCALE;
  let cells: KoreaMapCell[] = [];
  let columns = REGION_GRID_MIN_COLUMNS;
  let rows = 0;
  let projectedStep = 0;

  while (true) {
    projectedStep = projectedWidth / columns;
    rows = Math.ceil((bounds.maxLatitude - bounds.minLatitude) / projectedStep);
    cells = [];

    for (let row = 0; row < rows; row++) {
      const latitude = bounds.maxLatitude - (row + 0.5) * projectedStep;

      for (let column = 0; column < columns; column++) {
        const longitude = bounds.minLongitude + ((column + 0.5) * projectedStep) / LONGITUDE_SCALE;
        if (!geometries.some((geometry) => containsPoint(geometry, [longitude, latitude]))) continue;

        cells.push({
          count: 0,
          id: `${regionCode}-${row}-${column}`,
          latitude,
          level: 0,
          longitude,
          regionCode,
          // 칸 가운데가 윤곽 좌표와 같은 자리에 오도록 칸 사이 여백 절반만큼 민다.
          x: column * CELL_PITCH + CELL_GAP / 2,
          y: row * CELL_PITCH + CELL_GAP / 2,
        });
      }
    }

    if (cells.length >= minimumCellCount || columns >= REGION_GRID_MAX_COLUMNS) break;
    columns += 1;
  }

  const project = ([longitude, latitude]: Position) => ({
    x: (((longitude - bounds.minLongitude) * LONGITUDE_SCALE) / projectedStep) * CELL_PITCH,
    y: ((bounds.maxLatitude - latitude) / projectedStep) * CELL_PITCH,
  });
  const path = polygons.map((polygon) => toPathData(polygon, project)).join("");

  return {
    cells,
    columns,
    height: ((bounds.maxLatitude - bounds.minLatitude) / projectedStep) * CELL_PITCH,
    path,
    rows,
    width: columns * CELL_PITCH,
  };
};

const mapRecordsToCells = (cells: KoreaMapCell[], records: RecordLocation[]) => {
  if (cells.length === 0) return [];

  const counts = new Map<string, number>();

  for (const record of records) {
    let nearestCell = cells[0];
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const cell of cells) {
      const longitudeDistance = (cell.longitude - record.longitude) * LONGITUDE_SCALE;
      const latitudeDistance = cell.latitude - record.latitude;
      const distance = longitudeDistance * longitudeDistance + latitudeDistance * latitudeDistance;

      if (distance < nearestDistance) {
        nearestCell = cell;
        nearestDistance = distance;
      }
    }

    counts.set(nearestCell.id, (counts.get(nearestCell.id) ?? 0) + 1);
  }

  return cells.map((cell) => {
    const count = counts.get(cell.id) ?? 0;
    return { ...cell, count, level: getActivityLevel(count) };
  });
};

/** 처음 쓸 때 한 번만 만든다. 모듈을 불러오기만 하는 화면(서버 렌더 포함)이 그리드 계산 비용을 내지 않게 한다. */
const once = <T>(create: () => T) => {
  let value: T | undefined;
  return () => (value ??= create());
};

const getRegionMapGrids = once(() => new Map(REGIONS.map(({ code }) => [code, generateRegionCells(code)])));

export const createRegionActivityMaps = (records: RegionRecordLocation[]): RegionActivityMap[] => {
  const recordsByRegion = new Map<RegionCode, RegionRecordLocation[]>(REGIONS.map(({ code }) => [code, []]));
  for (const record of records) {
    const regionCode = getRegionCode(record.administrativeCode);
    if (regionCode) recordsByRegion.get(regionCode)?.push(record);
  }

  return REGIONS.map((region) => {
    const grid = getRegionMapGrids().get(region.code);
    const regionRecords = recordsByRegion.get(region.code) ?? [];
    const visitedSubdivisions = new Set(
      regionRecords.map(({ administrativeCode }) =>
        region.code === "KR-50" ? administrativeCode.slice(0, 8) : administrativeCode.slice(0, 5),
      ),
    );

    return {
      ...region,
      cells: mapRecordsToCells(grid?.cells ?? [], regionRecords),
      height: grid?.height ?? 0,
      path: grid?.path ?? "",
      totalCount: region.subdivisionCount,
      visitedCount: Math.min(visitedSubdivisions.size, region.subdivisionCount),
      width: grid?.width ?? 0,
    };
  });
};
