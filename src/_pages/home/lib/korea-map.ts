import koreaAdm1 from "../model/korea-adm1.geo.json" with { type: "json" };

export type ActivityLevel = 0 | 1 | 2 | 3 | 4;

export type RecordLocation = {
  id: string;
  latitude: number;
  longitude: number;
};

export type KoreaMapCell = {
  id: string;
  x: number;
  y: number;
  latitude: number;
  longitude: number;
  count: number;
  level: ActivityLevel;
  regionCode?: string;
  regionName?: string;
};

type Position = [number, number];
type PolygonCoordinates = Position[][];
type Geometry =
  | { type: "Polygon"; coordinates: PolygonCoordinates }
  | { type: "MultiPolygon"; coordinates: PolygonCoordinates[] };
type BoundaryFeature = {
  properties: { shapeISO: string; shapeName: string };
  geometry: Geometry;
};

type KoreaMapGrid = {
  cells: KoreaMapCell[];
  columns: number;
  rows: number;
  width: number;
  height: number;
};

const BOUNDARIES = koreaAdm1.features as unknown as BoundaryFeature[];
const GRID_COLUMNS = 64;
const CELL_SIZE = 4.4;
const CELL_GAP = 1.1;
const CELL_PITCH = CELL_SIZE + CELL_GAP;
const LONGITUDE_SCALE = Math.cos((36 * Math.PI) / 180);

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

function getBounds() {
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

  for (const feature of BOUNDARIES) {
    const polygons =
      feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    for (const polygon of polygons) for (const ring of polygon) for (const position of ring) include(position);
  }

  return { minLongitude, maxLongitude, minLatitude, maxLatitude };
}

function generateCells(columns: number): KoreaMapGrid {
  const bounds = getBounds();
  const projectedWidth = (bounds.maxLongitude - bounds.minLongitude) * LONGITUDE_SCALE;
  const projectedStep = projectedWidth / columns;
  const rows = Math.ceil((bounds.maxLatitude - bounds.minLatitude) / projectedStep);
  const cells: KoreaMapCell[] = [];

  for (let row = 0; row < rows; row++) {
    const latitude = bounds.maxLatitude - (row + 0.5) * projectedStep;

    for (let column = 0; column < columns; column++) {
      const longitude = bounds.minLongitude + ((column + 0.5) * projectedStep) / LONGITUDE_SCALE;
      const region = BOUNDARIES.find((feature) => containsPoint(feature.geometry, [longitude, latitude]));

      if (!region) continue;

      cells.push({
        id: `${row}-${column}`,
        x: column * CELL_PITCH,
        y: row * CELL_PITCH,
        latitude,
        longitude,
        count: 0,
        level: 0,
        regionCode: region.properties.shapeISO,
        regionName: region.properties.shapeName,
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

function mapRecordsToCells(cells: KoreaMapCell[], records: RecordLocation[]) {
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

export function createKoreaMap(records: RecordLocation[]): KoreaMapGrid {
  return { ...KOREA_MAP_GRID, cells: mapRecordsToCells(KOREA_MAP_GRID.cells, records) };
}
