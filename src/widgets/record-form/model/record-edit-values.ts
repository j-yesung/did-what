import { normalizeRecordCategories } from "@/entities/record/model/category";
import { sortPrimaryRecordRegions, sortPrimaryRegionFirst } from "@/entities/record/model/record-region";
import type { RecordSummary } from "@/entities/record/model/types";
import { normalizeRecordWeather } from "@/entities/record/model/weather";
import {
  toExistingRecordLocationPlace,
  toShortRegionName,
} from "@/features/record/select-record-location/model/location-picker";

type EditableRecord = Pick<
  RecordSummary,
  "activity" | "category" | "memo" | "recorded_at" | "recorded_until" | "region_code" | "region_label" | "weather"
> & {
  record_places: { place: Parameters<typeof toExistingRecordLocationPlace>[0] }[];
  record_regions: {
    region_code: string;
    region_label: string;
    region_name: string;
    region_latitude: number;
    region_longitude: number;
    selected_directly: boolean;
  }[];
};

export const toRecordEditValues = (record: EditableRecord) => ({
  activity: record.activity,
  category: normalizeRecordCategories(record.category),
  memo: record.memo ?? "",
  places: sortPrimaryRegionFirst(record.record_places, record.region_code, ({ place }) => place.region_code).map(
    ({ place }) => toExistingRecordLocationPlace(place),
  ),
  recordedAt: record.recorded_at,
  recordedUntil: record.recorded_until,
  regions: sortPrimaryRecordRegions(record.record_regions, record.region_code, record.region_label)
    .filter(({ selected_directly: selectedDirectly }) => selectedDirectly)
    .map((region) => ({
      code: region.region_code,
      fullName: region.region_name,
      label: region.region_label,
      latitude: region.region_latitude,
      longitude: region.region_longitude,
      name: toShortRegionName(region.region_name),
    })),
  weather: normalizeRecordWeather(record.weather),
});
