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
  // 통합 후 코드(12)와 통합 전 광주·전남 코드(29·46)를 함께 인식해 기존 기록도 이어서 집계한다.
  { administrativeCodes: ["12", "29", "46"], code: "KR-12", name: "전남광주통합특별시", subdivisionCount: 27 },
  { administrativeCodes: ["30"], code: "KR-30", name: "대전광역시", subdivisionCount: 5 },
  { administrativeCodes: ["31"], code: "KR-31", name: "울산광역시", subdivisionCount: 5 },
  { administrativeCodes: ["36"], code: "KR-50", name: "세종특별자치시", subdivisionCount: 33 },
  { administrativeCodes: ["41"], code: "KR-41", name: "경기도", subdivisionCount: 47 },
  { administrativeCodes: ["42", "51"], code: "KR-42", name: "강원특별자치도", subdivisionCount: 18 },
  { administrativeCodes: ["43"], code: "KR-43", name: "충청북도", subdivisionCount: 14 },
  { administrativeCodes: ["44"], code: "KR-44", name: "충청남도", subdivisionCount: 16 },
  { administrativeCodes: ["45", "52"], code: "KR-45", name: "전북특별자치도", subdivisionCount: 15 },
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
const REGION_CODE_ALIASES = new Map<string, RegionCode>([
  ["KR-29", "KR-12"],
  ["KR-46", "KR-12"],
]);

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

const isRegionCode = (value: string): value is RegionCode => {
  return REGION_CODES.has(value);
};

export const getRegion = (regionCode: string) => {
  const canonicalCode = REGION_CODE_ALIASES.get(regionCode) ?? regionCode;
  return REGIONS.find(({ code }) => code === canonicalCode);
};

export const getRegionCode = (administrativeCode: string): RegionCode | null => {
  const prefix = administrativeCode.slice(0, 2);
  return REGIONS.find((region) => (region.administrativeCodes as readonly string[]).includes(prefix))?.code ?? null;
};

export const filterRecordsByRegion = <T extends { region_code: string }>(
  records: readonly T[],
  regionCode: RegionCode,
) => {
  return records.filter((record) => getRegionCode(record.region_code) === regionCode);
};

export const getRegionProgressLabel = ({
  totalCount,
  visitedCount,
}: Pick<RegionActivityMap, "totalCount" | "visitedCount">) => {
  if (visitedCount === 0) return `0 / ${totalCount} · 미기록`;
  if (visitedCount === totalCount) return `${totalCount} / ${totalCount} · 모두 채움`;
  return `${visitedCount} / ${totalCount} · ${totalCount - visitedCount}곳 남음`;
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

const getBoundaryRegionCode = (value: string): RegionCode | null => {
  const canonicalCode = REGION_CODE_ALIASES.get(value) ?? value;
  return isRegionCode(canonicalCode) ? canonicalCode : null;
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

const generateCells = (columns: number): KoreaMapGrid => {
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
      const regionCode = region ? getBoundaryRegionCode(region.properties.shapeISO) : null;

      if (!regionCode) continue;

      cells.push({
        id: `${row}-${column}`,
        x: column * CELL_PITCH,
        y: row * CELL_PITCH,
        latitude,
        longitude,
        count: 0,
        level: 0,
        regionCode,
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
};

const generateRegionCells = (regionCode: RegionCode): KoreaMapGrid => {
  const geometries = BOUNDARIES.filter(
    ({ properties }) => getBoundaryRegionCode(properties.shapeISO) === regionCode,
  ).map(({ geometry }) => geometry);
  if (geometries.length === 0) return { cells: [], columns: 0, height: 0, rows: 0, width: 0 };

  const bounds = getBounds(geometries);
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
        if (!geometries.some((geometry) => containsPoint(geometry, [longitude, latitude]))) continue;

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

const KOREA_MAP_BOUNDS = getBounds(BOUNDARIES.map(({ geometry }) => geometry));
const REGION_MAP_GRIDS = new Map(REGIONS.map(({ code }) => [code, generateRegionCells(code)]));

const projectPosition = ([longitude, latitude]: Position) => {
  const { minLongitude, maxLongitude, maxLatitude } = KOREA_MAP_BOUNDS;
  const step = ((maxLongitude - minLongitude) * LONGITUDE_SCALE) / GRID_COLUMNS;
  // 셀의 지리 좌표는 중심이며, SVG 사각형 사이의 여백 절반을 보정한다.
  return {
    x: (((longitude - minLongitude) * LONGITUDE_SCALE) / step) * CELL_PITCH - CELL_GAP / 2,
    y: ((maxLatitude - latitude) / step) * CELL_PITCH - CELL_GAP / 2,
  };
};

/**
 * 본토에서 먼 섬은 첫 화면 틀 안의 빈 바다로 당겨 그린다. 흔히 쓰는 울릉도 박스처럼 실제 자리가 아니다.
 * 백령도·대청도는 경계 데이터에 경기로 들어 있지만 실제로는 인천 옹진군이라 누르면 인천으로 연다.
 */
const ISLAND_INSETS: {
  east: number;
  latitudeShift: number;
  longitudeShift: number;
  north: number;
  regionCode?: RegionCode;
  south: number;
  west: number;
}[] = [
  { east: 131, latitudeShift: 0, longitudeShift: -1.35, north: 37.6, south: 37.4, west: 130.7 },
  {
    east: 124.85,
    latitudeShift: 0.2,
    longitudeShift: 1.55,
    north: 38.05,
    regionCode: "KR-28",
    south: 37.75,
    west: 124.5,
  },
];

const findIslandInset = ([longitude, latitude]: Position) =>
  ISLAND_INSETS.find(
    ({ east, north, south, west }) => longitude >= west && longitude <= east && latitude >= south && latitude <= north,
  );

// 지도에 그릴 자리. 옮긴 섬 안의 좌표는 섬과 함께 옮긴다.
const projectDisplayPosition = (position: Position) => {
  const inset = findIslandInset(position);
  return projectPosition(inset ? [position[0] + inset.longitudeShift, position[1] + inset.latitudeShift] : position);
};

const KOREA_MAP_GRID: KoreaMapGrid = (() => {
  const grid = generateCells(GRID_COLUMNS);
  const cells = grid.cells.map((cell) => {
    if (!findIslandInset([cell.longitude, cell.latitude])) return cell;
    const { x, y } = projectDisplayPosition([cell.longitude, cell.latitude]);
    return { ...cell, x: x - CELL_SIZE / 2, y: y - CELL_SIZE / 2 };
  });
  return { ...grid, cells };
})();

export const getKoreaMapPosition = ({ latitude, longitude }: Pick<RecordLocation, "latitude" | "longitude">) => {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !BOUNDARIES.some(({ geometry }) => containsPoint(geometry, [longitude, latitude]))
  )
    return null;

  return projectDisplayPosition([longitude, latitude]);
};

// 바다 위 모서리도 지도 좌표로 옮겨야 해서 육지 검사 없이 투영한다. 첫 화면에 담을 틀을 잡을 때 쓴다.
export const getKoreaMapFrame = ({
  east,
  north,
  south,
  west,
}: {
  east: number;
  north: number;
  south: number;
  west: number;
}) => {
  const topLeft = projectPosition([west, north]);
  const bottomRight = projectPosition([east, south]);
  return { x: topLeft.x, y: topLeft.y, width: bottomRight.x - topLeft.x, height: bottomRight.y - topLeft.y };
};

// 셀 지도와 같은 좌표계로 시·도 경계를 그려 셀 대신 실제 지도 모양 위에 기록을 겹칠 수 있게 한다.
// 옮긴 섬은 지역 코드를 바로잡을 수 있게 따로 묶는다.
export const KOREA_MAP_REGION_PATHS = BOUNDARIES.flatMap(({ geometry, properties }) => {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const paths = new Map<string, string>();

  for (const polygon of polygons) {
    const code = findIslandInset(polygon[0][0])?.regionCode ?? properties.shapeISO;
    const path = polygon
      .map(
        (ring) =>
          `M${ring
            .map((position) => {
              const { x, y } = projectDisplayPosition(position);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join("L")}Z`,
      )
      .join("");
    paths.set(code, (paths.get(code) ?? "") + path);
  }

  return [...paths].map(([code, path]) => ({ code, key: `${properties.shapeISO}:${code}`, path }));
});

export const createKoreaMap = (records: RecordLocation[]): KoreaMapGrid => {
  return { ...KOREA_MAP_GRID, cells: mapRecordsToCells(KOREA_MAP_GRID.cells, records) };
};

export const createRegionActivityMaps = (records: RegionRecordLocation[]): RegionActivityMap[] => {
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
};
