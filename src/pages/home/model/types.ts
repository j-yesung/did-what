import type { RecordSummary } from "@/entities/record/model/types";
import type { RegionCode } from "@/entities/region/model/region";

type HomePlace = {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
};

type HomeRegion = {
  region_code: string;
  region_label: string;
  region_latitude: number;
  region_longitude: number;
  region_name: string;
};

type HomeRecordPlace = {
  place: HomePlace | null;
};

type HomeRecordRelations = {
  record_places: HomeRecordPlace[];
  record_regions: HomeRegion[];
};

type HomeRecordField =
  | "activity"
  | "category"
  | "id"
  | "record_comments"
  | "recorded_at"
  | "recorded_until"
  | "region_code"
  | "region_label"
  | "region_name";

export type HomeRecord = Pick<RecordSummary, HomeRecordField> & HomeRecordRelations;

export type RelationshipStats = {
  metOn: string;
  daysTogether: number;
};

export type ThisTime = {
  yearsAgo: number;
  record: HomeRecord;
  records: HomeRecord[];
};

export type RegionSummary = {
  code: RegionCode;
  label: string;
  name: string;
  records: HomeRecord[];
};

export type TopPlace = HomePlace & {
  count: number;
  last: Pick<HomeRecord, "activity" | "id" | "recorded_at">;
};
