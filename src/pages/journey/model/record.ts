import { getRegionCode } from "@/entities/region/model/region";
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

/**
 * A home-map record as one journey within a 시·도. The destination follows the directions server
 * (travel-prototype-model): the first matching region by name, then code, so the drawn end point is the one it routes to.
 */
export const toJourneyRecord = (record: MapRecord, regionCode: string): JourneyRecord | null => {
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
