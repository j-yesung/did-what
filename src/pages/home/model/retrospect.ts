import { getRegionCode, REGIONS, type RegionCode } from "@/entities/region/model/region";
import { callName } from "@/shared/lib/text/call-name";

import type { HomeRecord, RegionSummary, RelationshipStats, ThisTime, TopPlace } from "./types";

const DAY = 86_400_000;
const WINDOW_DAYS = 3;
const TOP_PLACE_COUNT = 3;

const toUtc = (date: string) => Date.parse(`${date}T00:00:00Z`);

export const getGreeting = (name: string) => `어디 다녀왔어, ${callName(name)}?`;

export const getRelationshipStats = (today: string, metOn: string | null = null): RelationshipStats | null => {
  if (!metOn || metOn > today) return null;
  return {
    metOn,
    daysTogether: Math.round((toUtc(today) - toUtc(metOn)) / DAY) + 1,
  };
};

export const pickAroundThisTime = (records: readonly HomeRecord[], today: string): ThisTime | null => {
  const [todayYear, month, day] = today.split("-").map(Number);
  const matched: { yearsAgo: number; record: HomeRecord }[] = [];

  for (const record of records) {
    const recordYear = Number(record.recorded_at.slice(0, 4));
    const time = toUtc(record.recorded_at);
    for (const year of [recordYear, recordYear + 1]) {
      const yearsAgo = todayYear - year;
      if (yearsAgo < 1 || Math.abs(time - Date.UTC(year, month - 1, day)) > WINDOW_DAYS * DAY) continue;
      matched.push({ yearsAgo, record });
      break;
    }
  }
  if (!matched.length) return null;

  matched.sort((a, b) => a.yearsAgo - b.yearsAgo || b.record.recorded_at.localeCompare(a.record.recorded_at));
  return { yearsAgo: matched[0].yearsAgo, record: matched[0].record, records: matched.map(({ record }) => record) };
};

export const summarizeRegions = (records: readonly HomeRecord[]): RegionSummary[] =>
  REGIONS.map(({ code, label, name }) => ({
    code,
    label,
    name,
    records: records.filter((record) =>
      record.record_regions.some(({ region_code }) => getRegionCode(region_code) === code),
    ),
  }));

const getSubregionName = (regionName: string) => regionName.split(" ")[1] ?? regionName;

export const getSubregions = (records: readonly HomeRecord[], code: RegionCode) =>
  records.map((record) => ({
    record,
    subregions: [
      ...new Set(
        record.record_regions
          .filter(({ region_code }) => getRegionCode(region_code) === code)
          .map(({ region_name }) => getSubregionName(region_name)),
      ),
    ],
  }));

export const countSubregions = (entries: readonly { subregions: readonly string[] }[]) => {
  const counts = new Map<string, number>();
  for (const { subregions } of entries) {
    for (const name of subregions) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts].sort(([, a], [, b]) => b - a);
};

export const toVisitPoints = (records: readonly HomeRecord[]) =>
  records.flatMap((record) => {
    const places = record.record_places.flatMap(({ place }) => (place ? [place] : []));
    if (places.length) return places.map(({ latitude, longitude }) => ({ latitude, longitude }));
    return record.record_regions
      .filter((region, index, all) => all.findIndex((item) => item.region_code === region.region_code) === index)
      .map(({ region_latitude, region_longitude }) => ({ latitude: region_latitude, longitude: region_longitude }));
  });

export const rankPlaces = (records: readonly HomeRecord[]): TopPlace[] => {
  const places = new Map<string, TopPlace>();
  for (const record of records) {
    const last = { activity: record.activity, id: record.id, recorded_at: record.recorded_at };
    for (const { place } of record.record_places) {
      if (!place) continue;
      const entry = places.get(place.id) ?? { ...place, count: 0, last };
      entry.count += 1;
      if (record.recorded_at > entry.last.recorded_at) entry.last = last;
      places.set(place.id, entry);
    }
  }
  return [...places.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ko"))
    .slice(0, TOP_PLACE_COUNT);
};
