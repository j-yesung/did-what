import "server-only";

import { requireMember } from "@/entities/member/server";
import { toRecordMapPoints } from "@/widgets/region-activity-map/model/record-map-points";

import { type JourneyRecordRow, toJourneyRegions } from "../model/record";

export const getJourneyRegions = async () => {
  const { supabase, user } = await requireMember();
  const records: (JourneyRecordRow & { recorded_at: string })[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("records")
      .select(
        "id, recorded_at, region_code, record_regions(region_code, region_name, region_latitude, region_longitude, selected_directly), record_places(place:places(id, name, latitude, longitude))",
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
    visits: records.flatMap((record) => {
      const placeIds = record.record_places.flatMap(({ place }) => (place ? [place.id] : []));
      return toRecordMapPoints([record]).map(({ latitude, longitude }, index) => ({
        latitude,
        longitude,
        recordId: record.id,
        placeId: placeIds[index] ?? null,
        recordedAt: record.recorded_at,
      }));
    }),
  };
};
