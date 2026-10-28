import "server-only";

import { requireMember } from "@/entities/member/server";
import { geocodeHomeAddress } from "@/features/home-address/api/geocode";

import { hasNoKakaoRoute, parseKakaoDirections, straightHomeRoute } from "../model/kakao-directions";
import { toJourneyRecord } from "../model/record";

export const getJourneyDirections = async (request: Request) => {
  const { supabase, user, member } = await requireMember();
  const params = new URL(request.url).searchParams;
  const id = params.get("recordId") ?? "";
  const region = params.get("region") ?? "";
  const target = params.get("placeId");
  const from = params.get("fromPlaceId");
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (
    !uuid.test(id) ||
    !/^KR-\d{2}$/.test(region) ||
    (target && !uuid.test(target)) ||
    (from && (!target || !uuid.test(from)))
  )
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  const homeOrigin = async () => {
    const { data: home, error: homeError } = await supabase
      .from("member_home_addresses")
      .select("address")
      .eq("owner_id", user.id)
      .eq("member_id", member.id)
      .maybeSingle();
    if (homeError) return Response.json({ error: "집 주소를 불러오지 못했어요." }, { status: 500 });
    if (!home)
      return Response.json(
        { error: "설정에서 집 주소를 등록해 주세요.", code: "HOME_ADDRESS_REQUIRED" },
        { status: 400 },
      );
    try {
      return await geocodeHomeAddress(home.address, request.signal);
    } catch {
      return Response.json({ error: "집 주소를 확인하지 못했어요. 설정에서 주소를 확인해 주세요." }, { status: 502 });
    }
  };
  const recordQuery = supabase
    .from("records")
    .select(
      "id, activity, recorded_at, record_regions(region_code, region_name, region_latitude, region_longitude), record_places(place:places(id, name, latitude, longitude))",
    )
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  const [{ data, error }, home] = await Promise.all([recordQuery, target ? null : homeOrigin()]);
  if (error) return Response.json({ error: "기록을 불러오지 못했어요." }, { status: 500 });
  const record = data && toJourneyRecord(data, region);
  const destination = target ? record?.places.find((place) => place.id === target) : record?.destination;
  if (!record || !destination) return Response.json({ error: "해당 장소를 찾을 수 없어요." }, { status: 404 });
  if (home instanceof Response) return home;
  const origin = from ? record.places.find((place) => place.id === from) : target ? record.destination : home;
  if (from && !origin) return Response.json({ error: "출발 장소를 찾을 수 없어요." }, { status: 404 });
  if (!origin) return Response.json({ error: "출발지를 찾을 수 없어요." }, { status: 404 });
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return Response.json({ error: "길찾기를 사용할 수 없어요." }, { status: 503 });
  const url = new URL("https://apis-navi.kakaomobility.com/v1/directions");
  url.searchParams.set("origin", `${origin.longitude},${origin.latitude}`);
  url.searchParams.set("destination", `${destination.longitude},${destination.latitude}`);
  url.searchParams.set("summary", "false");
  try {
    if (origin.longitude === destination.longitude && origin.latitude === destination.latitude)
      return Response.json(
        {
          route: {
            points: [
              [origin.longitude, origin.latitude],
              [destination.longitude, destination.latitude],
            ],
            distance: 0,
            duration: 0,
          },
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    const response = await fetch(url, {
      headers: { Authorization: `KakaoAK ${key}` },
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(10000)]),
    });
    const data: unknown = response.ok ? await response.json() : null;
    const route = parseKakaoDirections(data);
    if (route) return Response.json({ route }, { headers: { "Cache-Control": "private, no-store" } });
    if (!target && hasNoKakaoRoute(data))
      return Response.json(
        { route: straightHomeRoute(origin, destination) },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    throw new Error();
  } catch {
    return Response.json({ error: "도로 경로를 불러오지 못했어요." }, { status: 502 });
  }
};
