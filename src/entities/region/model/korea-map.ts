import koreaAdm1 from "./korea-adm1.geo.json" with { type: "json" };

export type ActivityLevel = 0 | 1 | 2 | 3 | 4;

export type RecordLocation = {
  id: string;
  latitude: number;
  longitude: number;
};

export type RegionRecordLocation = RecordLocation & {
  administrativeCode: string;
};

// 일반구가 있는 도시는 상위 시 대신 일반구를 세고, 시·군·구가 없는 세종은 법정 읍·면·동을 센다.
export const REGIONS = [
  { administrativeCodes: ["11"], code: "KR-11", name: "서울특별시", subdivisionCount: 25 },
  { administrativeCodes: ["26"], code: "KR-26", name: "부산광역시", subdivisionCount: 16 },
  { administrativeCodes: ["27"], code: "KR-27", name: "대구광역시", subdivisionCount: 9 },
  { administrativeCodes: ["28"], code: "KR-28", name: "인천광역시", subdivisionCount: 11 },
  { administrativeCodes: ["29"], code: "KR-29", name: "광주광역시", subdivisionCount: 5 },
  { administrativeCodes: ["30"], code: "KR-30", name: "대전광역시", subdivisionCount: 5 },
  { administrativeCodes: ["31"], code: "KR-31", name: "울산광역시", subdivisionCount: 5 },
  { administrativeCodes: ["36"], code: "KR-50", name: "세종특별자치시", subdivisionCount: 33 },
  { administrativeCodes: ["41"], code: "KR-41", name: "경기도", subdivisionCount: 47 },
  { administrativeCodes: ["42", "51"], code: "KR-42", name: "강원특별자치도", subdivisionCount: 18 },
  { administrativeCodes: ["43"], code: "KR-43", name: "충청북도", subdivisionCount: 14 },
  { administrativeCodes: ["44"], code: "KR-44", name: "충청남도", subdivisionCount: 16 },
  { administrativeCodes: ["45", "52"], code: "KR-45", name: "전북특별자치도", subdivisionCount: 15 },
  { administrativeCodes: ["46"], code: "KR-46", name: "전라남도", subdivisionCount: 22 },
  { administrativeCodes: ["47"], code: "KR-47", name: "경상북도", subdivisionCount: 23 },
  { administrativeCodes: ["48"], code: "KR-48", name: "경상남도", subdivisionCount: 22 },
  { administrativeCodes: ["49"], code: "KR-49", name: "제주특별자치도", subdivisionCount: 2 },
] as const;

export type Region = (typeof REGIONS)[number];
export type RegionCode = Region["code"];

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
  totalCount: number;
  visitedCount: number;
  width: number;
};

const BOUNDARIES = koreaAdm1.features as unknown as BoundaryFeature[];
const GRID_COLUMNS = 64;
const REGION_GRID_MAX_COLUMNS = 32;
const REGION_GRID_MIN_COLUMNS = 11;
const CELL_SIZE = 4.4;
const CELL_GAP = 1.1;
const CELL_PITCH = CELL_SIZE + CELL_GAP;
const LONGITUDE_SCALE = Math.cos((36 * Math.PI) / 180);
const REGION_CODES = new Set<string>(REGIONS.map(({ code }) => code));

export const KOREA_MAP_CELL_STYLE = {
  size: CELL_SIZE,
  gap: CELL_GAP,
  radius: 1.2,
} as const;

export function getActivityLevel(count: number): ActivityLevel {
  if (count >= 7) return 4;
  if (count >= 4) return 3;
  if (count >= 2) return 2;
  if (count >= 1) return 1;
  return 0;
}

export function isRegionCode(value: string): value is RegionCode {
  return REGION_CODES.has(value);
}

export function getRegion(regionCode: string) {
  return REGIONS.find(({ code }) => code === regionCode);
}

export function getRegionCode(administrativeCode: string): RegionCode | null {
  const prefix = administrativeCode.slice(0, 2);
  return REGIONS.find((region) => (region.administrativeCodes as readonly string[]).includes(prefix))?.code ?? null;
}

export function filterRecordsByRegion<T extends { region_code: string }>(
  records: readonly T[],
  regionCode: RegionCode,
) {
  return records.filter((record) => getRegionCode(record.region_code) === regionCode);
}

export function getRegionProgressLabel({
  totalCount,
  visitedCount,
}: Pick<RegionActivityMap, "totalCount" | "visitedCount">) {
  if (visitedCount === 0) return `0 / ${totalCount} · 미기록`;
  if (visitedCount === totalCount) return `${totalCount} / ${totalCount} · 모두 채움`;
  return `${visitedCount} / ${totalCount} · ${totalCount - visitedCount}곳 남음`;
}

function isPointInRing([x, y]: Position, ring: Position[]) {
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
}

function isPointInPolygon(point: Position, [outerRing, ...holes]: PolygonCoordinates) {
  return isPointInRing(point, outerRing) && !holes.some((hole) => isPointInRing(point, hole));
}

function containsPoint(geometry: Geometry, point: Position) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some((polygon) => isPointInPolygon(point, polygon));
}

function getBounds(geometries: Geometry[]) {
  let minLongitude = Number.POSITIVE_INFINITY;
  let maxLongitude = Number.NEGATIVE_INFINITY;
  let minLatitude = Number.POSITIVE_INFINITY;
  let maxLatitude = Number.NEGATIVE_INFINITY;

  function include([longitude, latitude]: Position) {
    minLongitude = Math.min(minLongitude, longitude);
    maxLongitude = Math.max(maxLongitude, longitude);
    minLatitude = Math.min(minLatitude, latitude);
    maxLatitude = Math.max(maxLatitude, latitude);
  }

  for (const geometry of geometries) {
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    for (const polygon of polygons) for (const ring of polygon) for (const position of ring) include(position);
  }

  return { minLongitude, maxLongitude, minLatitude, maxLatitude };
}

function generateCells(columns: number): KoreaMapGrid {
  const bounds = getBounds(BOUNDARIES.map(({ geometry }) => geometry));
  const projectedWidth = (bounds.maxLongitude - bounds.minLongitude) * LONGITUDE_SCALE;
  const projectedStep = projectedWidth / columns;
  const rows = Math.ceil((bounds.maxLatitude - bounds.minLatitude) / projectedStep);
  const cells: KoreaMapCell[] = [];

  for (let row = 0; row < rows; row++) {
    const latitude = bounds.maxLatitude - (row + 0.5) * projectedStep;

    for (let column = 0; column < columns; column++) {
      const longitude = bounds.minLongitude + ((column + 0.5) * projectedStep) / LONGITUDE_SCALE;
      const region = BOUNDARIES.find((feature) => containsPoint(feature.geometry, [longitude, latitude]));

      if (!region || !isRegionCode(region.properties.shapeISO)) continue;

      cells.push({
        id: `${row}-${column}`,
        x: column * CELL_PITCH,
        y: row * CELL_PITCH,
        latitude,
        longitude,
        count: 0,
        level: 0,
        regionCode: region.properties.shapeISO,
      });
    }
  }

  return {
    cells,
    columns,
    rows,
    width: columns * CELL_PITCH - CELL_GAP,
    height: rows * CELL_PITCH - CELL_GAP,
  };
}

function generateRegionCells(regionCode: RegionCode): KoreaMapGrid {
  const region = BOUNDARIES.find(({ properties }) => properties.shapeISO === regionCode);
  if (!region) return { cells: [], columns: 0, height: 0, rows: 0, width: 0 };

  const bounds = getBounds([region.geometry]);
  const minimumCellCount = getRegion(regionCode)?.subdivisionCount ?? 1;
  let cells: KoreaMapCell[] = [];
  let columns = REGION_GRID_MIN_COLUMNS;
  let rows = 0;

  while (true) {
    const projectedWidth = (bounds.maxLongitude - bounds.minLongitude) * LONGITUDE_SCALE;
    const projectedStep = projectedWidth / columns;
    rows = Math.ceil((bounds.maxLatitude - bounds.minLatitude) / projectedStep);
    cells = [];

    for (let row = 0; row < rows; row++) {
      const latitude = bounds.maxLatitude - (row + 0.5) * projectedStep;

      for (let column = 0; column < columns; column++) {
        const longitude = bounds.minLongitude + ((column + 0.5) * projectedStep) / LONGITUDE_SCALE;
        if (!containsPoint(region.geometry, [longitude, latitude])) continue;

        cells.push({
          count: 0,
          id: `${regionCode}-${row}-${column}`,
          latitude,
          level: 0,
          longitude,
          regionCode,
          x: column * CELL_PITCH,
          y: row * CELL_PITCH,
        });
      }
    }

    if (cells.length >= minimumCellCount || columns >= REGION_GRID_MAX_COLUMNS) break;
    columns += 1;
  }

  const minX = Math.min(...cells.map(({ x }) => x));
  const minY = Math.min(...cells.map(({ y }) => y));
  const maxX = Math.max(...cells.map(({ x }) => x));
  const maxY = Math.max(...cells.map(({ y }) => y));

  return {
    cells: cells.map((cell) => ({ ...cell, x: cell.x - minX, y: cell.y - minY })),
    columns,
    height: maxY - minY + CELL_SIZE,
    rows,
    width: maxX - minX + CELL_SIZE,
  };
}

function mapRecordsToCells(cells: KoreaMapCell[], records: RecordLocation[]) {
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
}

const KOREA_MAP_GRID = generateCells(GRID_COLUMNS);
const REGION_MAP_GRIDS = new Map(REGIONS.map(({ code }) => [code, generateRegionCells(code)]));

export function createKoreaMap(records: RecordLocation[]): KoreaMapGrid {
  return { ...KOREA_MAP_GRID, cells: mapRecordsToCells(KOREA_MAP_GRID.cells, records) };
}

export function createRegionActivityMaps(records: RegionRecordLocation[]): RegionActivityMap[] {
  const recordsByRegion = new Map<RegionCode, RegionRecordLocation[]>(REGIONS.map(({ code }) => [code, []]));
  for (const record of records) {
    const regionCode = getRegionCode(record.administrativeCode);
    if (regionCode) recordsByRegion.get(regionCode)?.push(record);
  }

  return REGIONS.map((region) => {
    const grid = REGION_MAP_GRIDS.get(region.code);
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
      totalCount: region.subdivisionCount,
      visitedCount: Math.min(visitedSubdivisions.size, region.subdivisionCount),
      width: grid?.width ?? 0,
    };
  });
}
