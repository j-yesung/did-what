import { createClient } from "@/shared/api/supabase/client";

import type { RecordFilters } from "../model/record-filters";
import {
  getRecordCursor,
  getRecordCursorFilter,
  getRecordPeriodFilter,
  RECORD_PAGE_SIZE,
  type RecordCursor,
} from "../model/record-page";

const COLUMNS =
  "id, activity, memo, weather, recorded_at, recorded_until, created_at, region_code, region_label, region_name";

export async function fetchRecordPage(filters: RecordFilters, cursor: RecordCursor | null) {
  const ascending = filters.sort === "oldest";
  const period = getRecordPeriodFilter(filters);
  let query = createClient()
    .from("records")
    .select(COLUMNS)
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
}
