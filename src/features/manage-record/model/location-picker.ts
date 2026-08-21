import type { KakaoRegion } from "@/shared/api/kakao-local";

import type { RecordPlaceReference } from "./record-form";

export type RecordLocationRegion = KakaoRegion & { label: string };

export type RecordLocationPlace = {
  address: string | null;
  key: string;
  name: string;
  reference: RecordPlaceReference;
  saved: boolean;
};

/** 기록에서 지역만 뽑아 쓸 때의 최소 형태. records 쿼리가 돌려주는 행의 일부다. */
export type RecordRegionRow = {
  region_code: string;
  region_label: string;
  region_latitude: number;
  region_longitude: number;
  region_name: string;
};

/** 지역 칩에 몇 개까지 보여줄지. 한 줄이나 두 줄에 들어가는 선. */
const RECENT_REGION_LIMIT = 6;

/**
 * 기록에 남은 지역을 최근 순으로 훑어 중복을 거른다.
 *
 * records 쿼리가 이미 recorded_at 내림차순으로 정렬해 주므로 여기서 다시 정렬하지 않는다.
 * 짧은 이름(name)은 전체 이름의 마지막 마디에서 얻는다. "서울 마포구 망원동" → "망원동".
 */
export function toRecentRegions(records: RecordRegionRow[], limit = RECENT_REGION_LIMIT): RecordLocationRegion[] {
  const seen = new Set<string>();
  const regions: RecordLocationRegion[] = [];

  for (const record of records) {
    if (!record.region_code || seen.has(record.region_code)) continue;

    seen.add(record.region_code);
    regions.push({
      code: record.region_code,
      fullName: record.region_name,
      label: record.region_label,
      latitude: record.region_latitude,
      longitude: record.region_longitude,
      name: record.region_name.split(" ").at(-1) ?? record.region_name,
    });

    if (regions.length >= limit) break;
  }

  return regions;
}

export type ResolveRecordPlaceResult = { error: string } | { place: RecordLocationPlace; region: RecordLocationRegion };
