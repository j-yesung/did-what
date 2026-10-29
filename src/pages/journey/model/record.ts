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

export type JourneyRecordRow = Pick<MapRecord, "id" | "activity" | "recorded_at" | "record_places"> & {
  region_code?: string | null;
  record_regions: (MapRecord["record_regions"][number] & { selected_directly?: boolean })[];
};

const MAINLAND_LONGITUDE = { min: 125.8, max: 129.9 };
const onMainland = ({ longitude }: Point) => longitude >= MAINLAND_LONGITUDE.min && longitude <= MAINLAND_LONGITUDE.max;

export const toJourneyRecord = (record: JourneyRecordRow, regionCode: string): JourneyRecord | null => {
  const priority = (region: JourneyRecordRow["record_regions"][number]) =>
    region.region_code === record.region_code ? 2 : region.selected_directly ? 1 : 0;
  const [destination] = record.record_regions
    .filter((region) => getRegionCode(region.region_code) === regionCode)
    .toSorted(
      (a, b) =>
        priority(b) - priority(a) ||
        a.region_name.localeCompare(b.region_name, "ko") ||
        a.region_code.localeCompare(b.region_code),
    );
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

export const toJourneyRegions = (records: readonly JourneyRecordRow[]) => {
  const regions = new Map<string, { code: string; name: string; latitude: number; longitude: number; count: number }>();
  for (const record of records)
    for (const code of new Set(record.record_regions.map((region) => getRegionCode(region.region_code)))) {
      if (!code) continue;
      const region = regions.get(code);
      const destination = toJourneyRecord(record, code)?.destination;
      if (region) {
        region.count++;
        if (destination && !onMainland(region) && onMainland(destination))
          Object.assign(region, { latitude: destination.latitude, longitude: destination.longitude });
        continue;
      }
      const info = getRegion(code);
      if (info && destination)
        regions.set(code, {
          code,
          name: info.label,
          latitude: destination.latitude,
          longitude: destination.longitude,
          count: 1,
        });
    }
  return [...regions.values()].map((region) => ({
    ...region,
    longitude: Math.min(MAINLAND_LONGITUDE.max, Math.max(MAINLAND_LONGITUDE.min, region.longitude)),
  }));
};
