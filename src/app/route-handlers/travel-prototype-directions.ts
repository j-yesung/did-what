import "server-only";

import { parseTravelDirections, TRAVEL_DEMO_HOMES } from "@/app/route-handlers/travel-directions-model";
import { groupTravelRecords } from "@/app/route-handlers/travel-prototype-model";
import { requireUser } from "@/shared/api/supabase/require-user";

export const getTravelDirections = async (request: Request) => {
  const { supabase, user } = await requireUser();
  const params = new URL(request.url).searchParams;
  const recordId = params.get("recordId") ?? "";
  const regionCode = params.get("region") ?? "";
  const homeIndex = params.get("home");
  const placeId = params.get("placeId");
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (
    !uuid.test(recordId) ||
    !/^KR-\d{2}$/.test(regionCode) ||
    (placeId ? !uuid.test(placeId) || homeIndex !== null : homeIndex !== "0")
  ) {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("records")
    .select(
      "id, activity, recorded_at, record_regions(region_code, region_name, region_latitude, region_longitude), record_places(created_at, place:places(id, name, latitude, longitude))",
    )
    .eq("id", recordId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error) return Response.json({ error: "기록을 불러오지 못했어요." }, { status: 500 });
  const record = data && groupTravelRecords([data])[regionCode]?.records[0];
  const destination = placeId ? record?.places.find((place) => place.id === placeId) : record?.destination;
  if (!record || !destination) return Response.json({ error: "해당 지역의 기록을 찾을 수 없어요." }, { status: 404 });

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) return Response.json({ error: "길찾기를 사용할 수 없어요." }, { status: 503 });

  try {
    const origin = placeId ? record.destination : TRAVEL_DEMO_HOMES[Number(homeIndex)];
    const url = new URL("https://apis-navi.kakaomobility.com/v1/directions");
    url.searchParams.set("origin", `${origin.longitude},${origin.latitude}`);
    url.searchParams.set("destination", `${destination.longitude},${destination.latitude}`);
    url.searchParams.set("summary", "false");
    const response = await fetch(url, {
      headers: { Authorization: `KakaoAK ${apiKey}` },
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(10000)]),
    });
    if (!response.ok) throw new Error("Directions request failed");
    const route = parseTravelDirections(await response.json());
    if (!route) throw new Error("Directions unavailable");
    return Response.json({ route }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "도로 경로를 불러오지 못했어요." }, { status: 502 });
  }
};
