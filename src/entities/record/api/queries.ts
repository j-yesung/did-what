import { createClient } from "@/shared/api/supabase/server";

import type { RecordFilters } from "../model/record-filters";

const SEARCH_COLUMNS = ["activity", "memo", "region_label", "region_name"];
const LIST_COLUMNS = "id, activity, memo, recorded_at, region_label, region_name, record_people(person:people(name))";
const DETAIL_COLUMNS =
  "id, activity, memo, recorded_at, region_code, region_label, region_name, region_latitude, region_longitude, record_people(person_id, person:people(name)), record_places(place:places(id, name, address, saved_at))";

// 지도에 찍을 지역 대표 좌표만 가져온다.
export async function getRecordLocations(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("records")
    .select("id, region_latitude, region_longitude")
    .eq("owner_id", ownerId);

  return {
    locations: (data ?? []).map(({ id, region_latitude: latitude, region_longitude: longitude }) => ({
      id,
      latitude,
      longitude,
    })),
    error,
  };
}

// 검색어·기간·정렬을 반영한 기록 목록. 필터를 넘기지 않으면 최신순 전체.
export async function getRecords(ownerId: string, filters?: RecordFilters) {
  const supabase = await createClient();
  const ascending = filters?.sort === "oldest";
  let builder = supabase.from("records").select(LIST_COLUMNS).eq("owner_id", ownerId);

  if (filters?.query) {
    builder = builder.or(SEARCH_COLUMNS.map((column) => `${column}.ilike.%${filters.query}%`).join(","));
  }

  if (filters?.from) {
    builder = builder.gte("recorded_at", filters.from);
  }

  if (filters?.to) {
    builder = builder.lte("recorded_at", filters.to);
  }

  return builder.order("recorded_at", { ascending }).order("created_at", { ascending });
}

// 소유자의 기록 하나. 없으면 data가 null이다.
export async function getRecord(recordId: string, ownerId: string) {
  const supabase = await createClient();

  return supabase.from("records").select(DETAIL_COLUMNS).eq("id", recordId).eq("owner_id", ownerId).maybeSingle();
}
