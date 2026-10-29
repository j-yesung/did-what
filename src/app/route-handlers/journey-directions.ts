import "server-only";

import { getMemberHomeAddress, requireMember } from "@/entities/member/server";
import { getRegion } from "@/entities/region/model/region";
import { geocodeHomeAddress, HomeAddressLocationError } from "@/features/home-address/api/geocode";
import {
  hasNoKakaoRoute,
  nearbyRoute,
  parseKakaoDirections,
  straightHomeRoute,
} from "@/pages/journey/model/kakao-directions";
import { toJourneyRecord } from "@/pages/journey/model/record";
import { isUuid } from "@/shared/lib/validation/is-uuid";

export const getJourneyDirections = async (request: Request) => {
  const { supabase, user } = await requireMember();
  const params = new URL(request.url).searchParams;
  const id = params.get("recordId") ?? "";
  const region = params.get("region") ?? "";
  const target = params.get("placeId");
  const from = params.get("fromPlaceId");
  if (!isUuid(id) || !getRegion(region) || (target && !isUuid(target)) || (from && (!target || !isUuid(from))))
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });

  const homeOrigin = async () => {
    const { data: home, error: homeError } = await getMemberHomeAddress();
    if (homeError) return Response.json({ error: "집 주소를 불러오지 못했어요." }, { status: 500 });
    if (!home) return Response.json({ error: "집 주소를 등록해 주세요." }, { status: 400 });

    try {
      return await geocodeHomeAddress(home.address, request.signal);
    } catch (error) {
      return Response.json(
        {
          error:
            error instanceof HomeAddressLocationError
              ? "집 주소의 위치를 찾지 못했어요. 집 주소를 다시 등록해 주세요."
              : "집 주소를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.",
        },
        { status: 502 },
      );
    }
  };

  const recordQuery = supabase
    .from("records")
    .select(
      "id, region_code, record_regions(region_code, region_name, region_latitude, region_longitude, selected_directly), record_places(place:places(id, name, latitude, longitude))",
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
    const nearby = nearbyRoute(origin, destination);
    if (nearby)
      return Response.json(
        { route: target ? nearby : { ...nearby, points: straightHomeRoute(origin, destination).points } },
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
    if (request.signal.aborted) return new Response(null, { status: 499 });

    const resultCode =
      data && typeof data === "object" && "routes" in data && Array.isArray(data.routes)
        ? data.routes[0]?.result_code
        : undefined;
    // biome-ignore lint/suspicious/noConsole: 길찾기 실패 원인을 운영 로그로 남긴다.
    console.warn("[journey] 길찾기 응답 실패", { status: response.status, resultCode });

    if (target && hasNoKakaoRoute(data))
      return Response.json({ error: "이 장소까지 자동차 경로가 없어요.", code: "NO_ROUTE" }, { status: 422 });
    if (!target && hasNoKakaoRoute(data))
      return Response.json(
        { route: straightHomeRoute(origin, destination) },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    return Response.json({ error: "도로 경로를 불러오지 못했어요." }, { status: 502 });
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    // biome-ignore lint/suspicious/noConsole: 길찾기 실패 원인을 운영 로그로 남긴다.
    console.warn("[journey] 길찾기 요청 실패", { name: error instanceof Error ? error.name : "UnknownError" });
    return Response.json({ error: "도로 경로를 불러오지 못했어요." }, { status: 502 });
  }
};
