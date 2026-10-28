import { getRegion, getRegionCode } from "@/entities/region/model/region";

type Place = { id: string; name: string; latitude: number; longitude: number };
export type TravelRecord = {
  id: string;
  activity: string;
  memo?: string | null;
  recorded_at: string;
  record_regions: { region_code: string; region_name: string; region_latitude: number; region_longitude: number }[];
  record_places: { created_at: string; place: Place | null }[];
};

type Item = { id: string; title: string; date: string; places: Place[]; memo: string | null };
type District = { name: string; latitude: number; longitude: number; records: Item[] };
type Destination = { name: string; latitude: number; longitude: number };
type Group = {
  name: string;
  latitude: number;
  longitude: number;
  records: (Item & { destination: Destination })[];
  districts: Map<string, District>;
};

export const groupTravelRecords = (records: readonly TravelRecord[]) => {
  const groups = new Map<string, Group>();
  for (const record of records) {
    const places = record.record_places
      .filter((link) => link.place !== null)
      .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.place!.id.localeCompare(b.place!.id))
      .map((link) => link.place!);
    const item = { id: record.id, title: record.activity, date: record.recorded_at, memo: record.memo ?? null, places };
    const seen = new Set<string>();
    const seenDistricts = new Set<string>();
    for (const region of record.record_regions.toSorted(
      (a, b) => a.region_name.localeCompare(b.region_name, "ko") || a.region_code.localeCompare(b.region_code),
    )) {
      const code = getRegionCode(region.region_code);
      const info = code ? getRegion(code) : null;
      if (!code || !info) continue;
      if (!groups.has(code)) {
        groups.set(code, {
          name: info.label,
          latitude: region.region_latitude,
          longitude: region.region_longitude,
          records: [],
          districts: new Map(),
        });
      }
      const group = groups.get(code)!;
      if (!seen.has(code)) {
        seen.add(code);
        group.records.push({
          ...item,
          destination: {
            name: region.region_name,
            latitude: region.region_latitude,
            longitude: region.region_longitude,
          },
        });
      }
      const parts = region.region_name.trim().split(/\s+/);
      const districtName = parts.length > 1 ? parts[1] : "세부 지역 미상";
      const districtKey = `${code}:${districtName}`;
      if (seenDistricts.has(districtKey)) continue;
      seenDistricts.add(districtKey);
      if (!group.districts.has(districtName)) {
        group.districts.set(districtName, {
          name: districtName,
          latitude: region.region_latitude,
          longitude: region.region_longitude,
          records: [],
        });
      }
      group.districts.get(districtName)!.records.push(item);
    }
  }

  return Object.fromEntries(
    [...groups].map(([code, group]) => [
      code,
      {
        ...group,
        districts: [...group.districts.values()].sort(
          (a, b) => b.records.length - a.records.length || a.name.localeCompare(b.name, "ko"),
        ),
      },
    ]),
  );
};
