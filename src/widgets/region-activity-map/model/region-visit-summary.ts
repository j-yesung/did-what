import { getRegionCode, type Region } from "@/entities/region/model/region";

import type { MapRecord } from "./record-map-points";

// 한 기록에 같은 시·도의 여러 시·군·구가 있어도 지역 카드의 기록 수는 한 번만 센다.
export const getRegionRecordCounts = (records: readonly Pick<MapRecord, "record_regions">[]) => {
  const counts = new Map<Region["code"], number>();
  for (const record of records) {
    const codes = new Set(record.record_regions.map(({ region_code }) => getRegionCode(region_code)));
    for (const code of codes) {
      if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }
  return counts;
};
