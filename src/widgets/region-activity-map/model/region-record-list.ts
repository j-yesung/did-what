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

const shortDate = (date: string, withYear: boolean) => {
  const [year, month, day] = date.split("-").map(Number);
  return withYear ? `${year}.${month}.${day}` : `${month}.${day}`;
};

export const formatShortPeriod = (recordedAt: string, recordedUntil: string | null) => {
  const start = shortDate(recordedAt, true);
  if (!recordedUntil || recordedUntil === recordedAt) return start;

  return `${start}–${shortDate(recordedUntil, recordedUntil.slice(0, 4) !== recordedAt.slice(0, 4))}`;
};
