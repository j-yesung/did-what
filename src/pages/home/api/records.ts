import "server-only";

import { requireMember } from "@/entities/member/server";

import type { HomeRecord } from "../model/retrospect";

const PAGE_SIZE = 500;

export const getHomeRecords = async () => {
  const { supabase, user } = await requireMember();
  const records: HomeRecord[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("records")
      .select(
        "id, activity, category, recorded_at, recorded_until, region_code, region_label, region_name, record_regions(region_code, region_name, region_label, region_latitude, region_longitude), record_places(place:places(id, name, latitude, longitude)), record_comments(count)",
      )
      .eq("owner_id", user.id)
      .order("recorded_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    records.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return records;
};
