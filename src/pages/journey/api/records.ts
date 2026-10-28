import "server-only";

import { groupTravelRecords, type TravelRecord } from "@/app/route-handlers/travel-prototype-model";
import { requireMember } from "@/entities/member/server";
import { getRegion } from "@/entities/region/model/region";

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

export const getJourneyRecords = async (request: Request) => {
  const { supabase, user } = await requireMember();
  const params = new URL(request.url).searchParams;
  const code = params.get("region") ?? "";
  const region = getRegion(code);
  const page = Number(params.get("page") ?? 0);
  if (!region || region.code !== code || !Number.isSafeInteger(page) || page < 0 || page > 10000)
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  const filters = region.administrativeCodes.map((prefix) => `region_code.like.${prefix}%`).join(",");
  const { data, error } = await supabase
    .from("records")
    .select(
      "id, activity, memo, recorded_at, created_at, record_regions!inner(region_code, region_name, region_latitude, region_longitude), record_places(created_at, place:places(id, name, latitude, longitude))",
    )
    .eq("owner_id", user.id)
    .or(filters, { referencedTable: "record_regions" })
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(page * 15, page * 15 + 15);
  if (error) return Response.json({ error: "기록을 불러오지 못했어요." }, { status: 500 });
  const records = groupTravelRecords(data.slice(0, 15))[code]?.records ?? [];
  return Response.json(
    { records, nextPage: data.length > 15 ? page + 1 : null },
    { headers: { "Cache-Control": "private, no-store" } },
  );
};
