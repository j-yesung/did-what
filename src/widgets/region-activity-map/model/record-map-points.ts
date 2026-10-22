import type { Region } from "@/entities/region";

export type RegionCode = Region["code"];

export type MapRecord = {
  activity: string;
  category: string;
  id: string;
  recorded_at: string;
  recorded_until: string | null;
  record_places: { place: { id: string; latitude: number; longitude: number; name: string } | null }[];
  record_regions: { region_code: string; region_latitude: number; region_longitude: number; region_name: string }[];
};

export type RecordMapPoint = {
  activity: string;
  id: string;
  kind: "place" | "region";
  label: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
  recordId: string;
};

export const toRecordMapPoints = (records: readonly MapRecord[]): RecordMapPoint[] =>
  records.flatMap<RecordMapPoint>((record) => {
    const places = record.record_places.flatMap(({ place }) => (place ? [place] : []));
    if (places.length > 0) {
      return places.map((place) => ({
        activity: record.activity,
        id: `place:${record.id}:${place.id}`,
        kind: "place" as const,
        label: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        recordedAt: record.recorded_at,
        recordId: record.id,
      }));
    }

    return record.record_regions
      .filter((region, index, all) => all.findIndex((item) => item.region_code === region.region_code) === index)
      .map((region) => ({
        activity: record.activity,
        id: `region:${record.id}:${region.region_code}`,
        kind: "region" as const,
        label: region.region_name,
        latitude: region.region_latitude,
        longitude: region.region_longitude,
        recordedAt: record.recorded_at,
        recordId: record.id,
      }));
  });

// region_name은 "서울 중구", "충북 청주시 상당구"처럼 시·도 약칭 뒤에 시·군·구가 붙는다.
// 시 아래 일반구는 같은 시로 묶어야 청주 여행 한 번이 시트에서 청주시 칩 하나로 모인다.
export const getSubregionName = (regionName: string) => regionName.split(" ")[1] ?? regionName;
