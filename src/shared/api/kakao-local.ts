export type KakaoPlace = {
  address: string | null;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
};

const KAKAO_LOCAL_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
export const KAKAO_SEARCH_MAX_PAGE = 45;
const SEARCH_ERROR_MESSAGE = "장소를 검색하지 못했습니다. 잠시 후 다시 시도해 주세요.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function validateKakaoQuery(value: string): { valid: true; query: string } | { valid: false; error: string } {
  const query = value.trim();

  if (query.length < 1 || query.length > 100) {
    return { error: "검색어는 1자 이상 100자 이하로 입력해 주세요.", valid: false };
  }

  return { query, valid: true };
}

export function validateKakaoPlaceId(value: string): { valid: true; id: string } | { valid: false; error: string } {
  const id = value.trim();

  if (!/^\d{1,100}$/.test(id)) {
    return { error: "선택한 장소를 확인할 수 없습니다. 다시 검색해 주세요.", valid: false };
  }

  return { id, valid: true };
}

export function normalizeKakaoPage(value: unknown): number {
  const page = typeof value === "number" || typeof value === "string" ? Number(value) : 1;

  return Number.isInteger(page) && page >= 1 && page <= KAKAO_SEARCH_MAX_PAGE ? page : 1;
}

export function parseKakaoSearchResponse(
  payload: unknown,
): { isEnd: boolean; pageableCount: number; places: KakaoPlace[] } | null {
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
    });
  }

  return { isEnd: payload.meta.is_end, pageableCount: payload.meta.pageable_count, places };
}

export async function searchKakaoPlaces(
  value: string,
  pageValue: unknown = 1,
): Promise<
  | { isEnd: boolean; page: number; pageableCount: number; places: KakaoPlace[]; error?: never }
  | { places?: never; error: string }
> {
  const queryResult = validateKakaoQuery(value);

  if (!queryResult.valid) {
    return { error: queryResult.error };
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;

  if (!apiKey) {
    return { error: "장소 검색 설정이 필요합니다. 관리자에게 문의해 주세요." };
  }

  const url = new URL(KAKAO_LOCAL_URL);
  url.searchParams.set("query", queryResult.query);
  const page = normalizeKakaoPage(pageValue);
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", "15");

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
}
