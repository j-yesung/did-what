import { createClient } from "@/shared/api/supabase/server";

import type { RecordRegionFilter } from "./fetch-region-records";

const COLUMNS = "id, activity, memo, weather, recorded_at, recorded_until, created_at, region_code";

export async function getRegionRecords(region: RecordRegionFilter, ownerId: string) {
  const regionFilter = region.administrativeCodes.map((code) => `region_code.like.${code}*`).join(",");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("records")
    .select(COLUMNS)
    .eq("owner_id", ownerId)
    .or(regionFilter)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
}
