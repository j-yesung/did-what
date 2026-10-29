import { getRegion, getRegionCode } from "@/entities/region/model/region";
import type { MapRecord } from "@/widgets/region-activity-map/model/record-map-points";

import type { JourneyPlace, JourneyRegion, JourneyPoint as Point } from "./types";

export type { JourneyPlace } from "./types";
export type JourneyRecord = {
  id: string;
  places: JourneyPlace[];
  destination: Point & { name: string };
};

export type JourneyRecordRow = Pick<MapRecord, "id" | "record_places"> & {
  region_code?: string | null;
  record_regions: (MapRecord["record_regions"][number] & { selected_directly?: boolean })[];
};

const MAINLAND_LONGITUDE = { min: 125.8, max: 129.9 };
const onMainland = ({ longitude }: Point) => longitude >= MAINLAND_LONGITUDE.min && longitude <= MAINLAND_LONGITUDE.max;

const recordDestination = (record: Pick<JourneyRecordRow, "region_code" | "record_regions">, regionCode: string) => {
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
  return destination;
};

export const toJourneyRecord = (record: JourneyRecordRow, regionCode: string): JourneyRecord | null => {
  const destination = recordDestination(record, regionCode);
  if (!destination) return null;
  return {
    id: record.id,
    places: record.record_places.flatMap(({ place }) => (place ? [place] : [])),
    destination: {
      name: destination.region_name,
      latitude: destination.region_latitude,
      longitude: destination.region_longitude,
    },
  };
};

export const toJourneyRegions = (records: readonly Pick<JourneyRecordRow, "region_code" | "record_regions">[]) => {
  const regions = new Map<string, JourneyRegion>();
  for (const record of records)
    for (const code of new Set(record.record_regions.map((region) => getRegionCode(region.region_code)))) {
      if (!code) continue;
      const region = regions.get(code);
      const destination = recordDestination(record, code);
      if (region) {
        region.count++;
        if (
          destination &&
          !onMainland(region) &&
          onMainland({ longitude: destination.region_longitude, latitude: destination.region_latitude })
        )
          Object.assign(region, { latitude: destination.region_latitude, longitude: destination.region_longitude });
        continue;
      }
      const info = getRegion(code);
      if (info && destination)
        regions.set(code, {
          code,
          name: info.label,
          latitude: destination.region_latitude,
          longitude: destination.region_longitude,
          count: 1,
        });
    }
  return [...regions.values()].map((region) => ({
    ...region,
    longitude: Math.min(MAINLAND_LONGITUDE.max, Math.max(MAINLAND_LONGITUDE.min, region.longitude)),
  }));
};
