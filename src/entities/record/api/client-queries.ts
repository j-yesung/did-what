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
  "id, activity, category, memo, weather, recorded_at, recorded_until, created_at, region_code, region_label, region_name, record_regions(region_code, region_label), record_places(count), record_comments(count)";
const REGION_RECORD_COLUMNS =
  "id, activity, category, memo, weather, recorded_at, recorded_until, created_at, region_code, region_label, record_regions(region_code, region_label)";

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
    .select(
      "id, record_regions(region_code, region_label, region_name), record_places(place:places(id, name, address, saved_at))",
    )
    .eq("id", recordId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * 시·도에 속한 기록을 record_regions 기준으로 찾는다.
 * 기록 ID를 먼저 모아 한 번 더 조회하는 이유는, 기록 정렬은 records의 칼럼으로만 할 수 있어서다.
 */
// ponytail: 기록 ID를 통째로 in()에 넣는다. 한 시·도의 기록이 수천 개가 되면 페이지 단위 조회로 바꾼다.
export const fetchRegionRecords = async (region: RecordRegionFilter) => {
  const supabase = createClient();
  const regionFilter = region.administrativeCodes.map((code) => `region_code.like.${code}*`).join(",");
  const { data: links, error: linkError } = await supabase.from("record_regions").select("record_id").or(regionFilter);

  if (linkError) throw linkError;

  const recordIds = [...new Set(links.map(({ record_id: recordId }) => recordId))];
  if (recordIds.length === 0) return [];

  const { data, error } = await supabase
    .from("records")
    .select(REGION_RECORD_COLUMNS)
    .in("id", recordIds)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
};
