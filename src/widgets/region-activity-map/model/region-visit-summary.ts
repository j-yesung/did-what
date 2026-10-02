import { getLocationRegionCode, type Region } from "@/entities/region/model/korea-map";

import type { MapRecord } from "./record-map-points";

export const getRegionVisitSummary = (records: readonly MapRecord[], regionCode: Region["code"]) => {
  const places = new Map<string, { id: string; name: string; count: number; latestDate: string; recordId: string }>();
  let latestDate: string | null = null;
  for (const record of records) {
    if (!latestDate || record.recorded_at > latestDate) latestDate = record.recorded_at;
    const counted = new Set<string>();
    for (const { place } of record.record_places) {
      if (!place || counted.has(place.id) || getLocationRegionCode(place) !== regionCode) continue;
      counted.add(place.id);
      const previous = places.get(place.id);
      const latest = !previous || record.recorded_at > previous.latestDate;
      places.set(place.id, {
        id: place.id,
        name: place.name,
        count: (previous?.count ?? 0) + 1,
        latestDate: latest ? record.recorded_at : previous.latestDate,
        recordId: latest ? record.id : previous.recordId,
      });
    }
  }
  const rankedPlaces = [...places.values()].sort(
    (a, b) => b.count - a.count || b.latestDate.localeCompare(a.latestDate) || a.name.localeCompare(b.name, "ko"),
  );
  return { latestDate, places: rankedPlaces };
};
