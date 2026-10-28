import "server-only";

import { groupTravelRecords, type TravelRecord } from "@/app/route-handlers/travel-prototype-model";
import { requireMember } from "@/entities/member/server";

export const getJourneyRegions = async () => {
  const { supabase, user } = await requireMember();
  const records: TravelRecord[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("records")
      .select("id, activity, recorded_at, record_regions(region_code, region_name, region_latitude, region_longitude)")
      .eq("owner_id", user.id)
      .order("recorded_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + 499);
    if (error) throw error;
    records.push(...data.map((record) => ({ ...record, record_places: [] })));
    if (data.length < 500) break;
  }
  return Object.entries(groupTravelRecords(records)).map(([code, group]) => ({
    code,
    name: group.name,
    latitude: group.latitude,
    longitude: group.longitude,
    count: group.records.length,
  }));
};
