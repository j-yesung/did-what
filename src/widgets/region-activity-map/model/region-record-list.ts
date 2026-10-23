import { getRegionCode, type RegionCode } from "@/entities/region/model/region";
import { getSubregionName, type MapRecord } from "@/widgets/region-activity-map/model/record-map-points";

export const getRegionRecords = (records: readonly MapRecord[], regionCode: RegionCode | undefined) => {
  if (!regionCode) return [];

  return records.flatMap((record) => {
    const subregions = [
      ...new Set(
        record.record_regions
          .filter(({ region_code }) => getRegionCode(region_code) === regionCode)
          .map(({ region_name }) => getSubregionName(region_name)),
      ),
    ];
    return subregions.length > 0 ? [{ record, subregions }] : [];
  });
};

export const getSubregionCounts = (records: readonly { subregions: readonly string[] }[]) => {
  const counts = new Map<string, number>();
  for (const { subregions } of records) {
    for (const name of subregions) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts].sort(([, first], [, second]) => second - first);
};
