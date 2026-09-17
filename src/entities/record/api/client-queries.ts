import { createClient } from "@/shared/api/supabase/client";

import type { RecordFilters } from "../model/record-filters";
import {
  getRecordCursor,
  getRecordCursorFilter,
  getRecordPeriodFilter,
  RECORD_PAGE_SIZE,
  type RecordCursor,
} from "../model/record-page";
import { RECORD_DETAIL_COLUMNS, RECORD_LOCATION_COLUMNS } from "./record-columns";

const RECORD_PAGE_COLUMNS =
  "id, activity, memo, weather, recorded_at, recorded_until, created_at, region_code, region_label, region_name, record_places(count), record_comments(count)";
const REGION_RECORD_COLUMNS = "id, activity, memo, weather, recorded_at, recorded_until, created_at, region_code";

export type RecordRegionFilter = {
  administrativeCodes: readonly string[];
  code: string;
};

export const fetchRecord = async (recordId: string) => {
  const { data, error } = await createClient()
    .from("records")
    .select(RECORD_DETAIL_COLUMNS)
    .eq("id", recordId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const fetchRecordLocations = async () => {
  const { data, error } = await createClient()
    .from("records")
    .select(RECORD_LOCATION_COLUMNS)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchRecordPage = async (filters: RecordFilters, cursor: RecordCursor | null) => {
  const ascending = filters.sort === "oldest";
  const period = getRecordPeriodFilter(filters);
  let query = createClient()
    .from("records")
    .select(RECORD_PAGE_COLUMNS)
    .order("recorded_at", { ascending })
    .order("created_at", { ascending })
    .order("id", { ascending })
    .limit(RECORD_PAGE_SIZE + 1);

  if (period.from) query = query.or(period.from);
  if (period.to) query = query.lte("recorded_at", period.to);
  if (filters.query) {
    const pattern = `*${filters.query}*`;
    query = query.or(
      `activity.ilike.${pattern},memo.ilike.${pattern},region_label.ilike.${pattern},region_name.ilike.${pattern}`,
    );
  }
  if (cursor) query = query.or(getRecordCursorFilter(cursor, filters.sort));

  const { data, error } = await query;
  if (error) throw error;

  const records = data.slice(0, RECORD_PAGE_SIZE);
  return {
    nextCursor: data.length > RECORD_PAGE_SIZE ? getRecordCursor(records.at(-1)!) : null,
    records,
  };
};

// 기간과 겹치는 기록을 마지막 페이지까지 모은다. 중간에 실패하면 일부만 돌려주지 않고 전체를 실패로 둔다.
export const fetchRecordsInPeriod = async (period: Pick<RecordFilters, "from" | "to">) => {
  const filters: RecordFilters = { ...period, query: "", sort: "recent" };
  let page = await fetchRecordPage(filters, null);
  const records = [...page.records];

  while (page.nextCursor) {
    page = await fetchRecordPage(filters, page.nextCursor);
    records.push(...page.records);
  }

  return records;
};

export const fetchRecordPlaces = async (recordId: string) => {
  const { data, error } = await createClient()
    .from("records")
    .select("id, record_places(place:places(id, name, address, saved_at))")
    .eq("id", recordId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const fetchRegionRecords = async (region: RecordRegionFilter) => {
  const regionFilter = region.administrativeCodes.map((code) => `region_code.like.${code}*`).join(",");
  const { data, error } = await createClient()
    .from("records")
    .select(REGION_RECORD_COLUMNS)
    .or(regionFilter)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
};
