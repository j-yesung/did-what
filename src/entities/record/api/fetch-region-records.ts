import { createClient } from "@/shared/api/supabase/client";

const COLUMNS = "id, activity, memo, weather, recorded_at, recorded_until, created_at, region_code";

export type RecordRegionFilter = {
  administrativeCodes: readonly string[];
  code: string;
};

export async function fetchRegionRecords(region: RecordRegionFilter) {
  const regionFilter = region.administrativeCodes.map((code) => `region_code.like.${code}*`).join(",");
  const { data, error } = await createClient()
    .from("records")
    .select(COLUMNS)
    .or(regionFilter)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
}

export type RegionRecordRow = Awaited<ReturnType<typeof fetchRegionRecords>>[number];
