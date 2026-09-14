import type { KakaoPlace, KakaoSearchScope } from "./types.ts";
import { normalizeKakaoPage, validateKakaoPlaceId, validateKakaoQuery } from "./validation.ts";

/** 카카오 키워드 검색이 허용하는 최대 반경(미터). 더 넓힐 수 없다. */
const KAKAO_SEARCH_RADIUS = 20_000;
const KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const SEARCH_ERROR_MESSAGE = "장소를 검색하지 못했습니다. 잠시 후 다시 시도해 주세요.";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const parseKakaoSearchResponse = (
  payload: unknown,
): { isEnd: boolean; pageableCount: number; places: KakaoPlace[] } | null => {
  if (
    !isRecord(payload) ||
    !Array.isArray(payload.documents) ||
    !isRecord(payload.meta) ||
    typeof payload.meta.is_end !== "boolean" ||
    typeof payload.meta.pageable_count !== "number" ||
    !Number.isInteger(payload.meta.pageable_count) ||
    payload.meta.pageable_count < 0
  ) {
    return null;
  }

  const places: KakaoPlace[] = [];

  for (const document of payload.documents) {
    if (
      !isRecord(document) ||
      typeof document.id !== "string" ||
      typeof document.place_name !== "string" ||
      typeof document.address_name !== "string" ||
      typeof document.road_address_name !== "string" ||
      typeof document.x !== "string" ||
      typeof document.y !== "string"
    ) {
      return null;
    }

    const idResult = validateKakaoPlaceId(document.id);
    const name = document.place_name.trim();
    const longitudeText = document.x.trim();
    const latitudeText = document.y.trim();
    const longitude = Number(longitudeText);
    const latitude = Number(latitudeText);

    if (
      !idResult.valid ||
      name.length < 1 ||
      name.length > 200 ||
      !longitudeText ||
      !latitudeText ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return null;
    }

    places.push({
      address: document.road_address_name.trim() || document.address_name.trim() || null,
      id: idResult.id,
      latitude,
      longitude,
      name,
      parcelAddress: document.address_name.trim() || null,
    });
  }

  return { isEnd: payload.meta.is_end, pageableCount: payload.meta.pageable_count, places };
};

export const searchKakaoPlaces = async (
  value: string,
  pageValue: unknown = 1,
  scope?: KakaoSearchScope | null,
): Promise<
  | { isEnd: boolean; page: number; pageableCount: number; places: KakaoPlace[]; error?: never }
  | { places?: never; error: string }
> => {
  const queryResult = validateKakaoQuery(value);

  if (!queryResult.valid) {
    return { error: queryResult.error };
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;

  if (!apiKey) {
    return { error: "장소 검색 설정이 필요합니다. 관리자에게 문의해 주세요." };
  }

  const url = new URL(KAKAO_KEYWORD_URL);
  url.searchParams.set("query", queryResult.query);
  const page = normalizeKakaoPage(pageValue);
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", "15");

  if (scope) {
    url.searchParams.set("x", String(scope.longitude));
    url.searchParams.set("y", String(scope.latitude));
    url.searchParams.set("radius", String(KAKAO_SEARCH_RADIUS));
    url.searchParams.set("sort", "distance");
  }

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Authorization: `KakaoAK ${apiKey}` },
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return { error: SEARCH_ERROR_MESSAGE };
    }

    const result = parseKakaoSearchResponse(await response.json());

    return result ? { ...result, page } : { error: SEARCH_ERROR_MESSAGE };
  } catch {
    return { error: SEARCH_ERROR_MESSAGE };
  }
};
