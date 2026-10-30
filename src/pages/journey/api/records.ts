import "server-only";

import { requireMember } from "@/entities/member/server";
import { toRecordMapPoints } from "@/widgets/region-activity-map/model/record-map-points";

import { type JourneyRecordRow, toJourneyRegions } from "../model/record";

export const getJourneyRegions = async () => {
  const { supabase, user } = await requireMember();
  const records: JourneyRecordRow[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("records")
      .select(
        "id, region_code, record_regions(region_code, region_name, region_latitude, region_longitude, selected_directly), record_places(place:places(id, name, latitude, longitude))",
      )
      .eq("owner_id", user.id)
      .order("recorded_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + 499);
    if (error) throw error;
    records.push(...data);
    if (data.length < 500) break;
  }
  return {
    regions: toJourneyRegions(records),
    visits: toRecordMapPoints(records).map(({ latitude, longitude }) => ({ latitude, longitude })),
  };
};
