import { getRegion, getRegionCode } from "@/entities/region/model/region";
import type { MapRecord } from "@/widgets/region-activity-map/model/record-map-points";

type Point = { latitude: number; longitude: number };
export type JourneyPlace = Point & { id: string; name: string };
export type JourneyRecord = {
  id: string;
  title: string;
  date: string;
  places: JourneyPlace[];
  destination: Point & { name: string };
};
/** The columns a journey needs: the home map's record cache and the server queries both provide them. */
export type JourneyRecordRow = Pick<MapRecord, "id" | "activity" | "recorded_at" | "record_places" | "record_regions">;

/**
 * A record as one journey within a 시·도. The destination is the first matching region by name, then code. The
 * directions route calls this too, so the drawn end point is the one it routes to.
 */
export const toJourneyRecord = (record: JourneyRecordRow, regionCode: string): JourneyRecord | null => {
  const [destination] = record.record_regions
    .filter((region) => getRegionCode(region.region_code) === regionCode)
    .toSorted((a, b) => a.region_name.localeCompare(b.region_name, "ko") || a.region_code.localeCompare(b.region_code));
  if (!destination) return null;
  return {
    id: record.id,
    title: record.activity,
    date: record.recorded_at,
    places: record.record_places.flatMap(({ place }) => (place ? [place] : [])),
    destination: {
      name: destination.region_name,
      latitude: destination.region_latitude,
      longitude: destination.region_longitude,
    },
  };
};

/**
 * One map node per 시·도: how many records went there (each record once) and where to draw it, the first record's
 * destination. Pass records newest first so a node sits where the latest visit was.
 */
export const toJourneyRegions = (records: readonly JourneyRecordRow[]) => {
  const regions = new Map<string, { code: string; name: string; latitude: number; longitude: number; count: number }>();
  for (const record of records)
    for (const code of new Set(record.record_regions.map((region) => getRegionCode(region.region_code)))) {
      if (!code) continue;
      const region = regions.get(code);
      if (region) {
        region.count++;
        continue;
      }
      const info = getRegion(code);
      const destination = toJourneyRecord(record, code)?.destination;
      if (info && destination)
        regions.set(code, {
          code,
          name: info.label,
          latitude: destination.latitude,
          longitude: destination.longitude,
          count: 1,
        });
    }
  return [...regions.values()];
};
