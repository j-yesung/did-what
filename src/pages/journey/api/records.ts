import "server-only";

import { requireMember } from "@/entities/member/server";

import { type JourneyRecordRow, toJourneyRegions } from "../model/record";

export const getJourneyRegions = async () => {
  const { supabase, user } = await requireMember();
  const records: JourneyRecordRow[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("records")
      .select(
        "id, activity, recorded_at, region_code, record_regions(region_code, region_name, region_latitude, region_longitude, selected_directly)",
      )
      .eq("owner_id", user.id)
      .order("recorded_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + 499);
    if (error) throw error;
    records.push(...data.map((record) => ({ ...record, record_places: [] })));
    if (data.length < 500) break;
  }
  return toJourneyRegions(records);
};
