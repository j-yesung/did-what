export type KakaoPlace = {
  address: string | null;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  parcelAddress: string | null;
};

export type KakaoRegion = {
  code: string;
  fullName: string;
  latitude: number;
  longitude: number;
  name: string;
  type: "dong" | "eup" | "myeon";
};

export type KakaoRegionSearchResult = { regions: KakaoRegion[]; related: boolean } | { error: string };

const KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const KAKAO_ADDRESS_URL = "https://dapi.kakao.com/v2/local/search/address.json";
const KAKAO_COORD_REGION_URL = "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json";
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
      parcelAddress: document.address_name.trim() || null,
    });
  }

  return { isEnd: payload.meta.is_end, pageableCount: payload.meta.pageable_count, places };
}

function getRegionType(name: string): KakaoRegion["type"] | null {
  if (name.endsWith("동")) return "dong";
  if (name.endsWith("읍")) return "eup";
  if (name.endsWith("면")) return "myeon";
  return null;
}

function parseRegionDocument(document: unknown): KakaoRegion | null {
  if (!isRecord(document) || !isRecord(document.address)) {
    return null;
  }

  const { address } = document;
  if (
    typeof address.b_code !== "string" ||
    typeof address.region_1depth_name !== "string" ||
    typeof address.region_2depth_name !== "string" ||
    typeof address.region_3depth_name !== "string" ||
    typeof document.x !== "string" ||
    typeof document.y !== "string"
  ) {
    return null;
  }

  const code = address.b_code.trim();
  const name = address.region_3depth_name.trim();
  const type = getRegionType(name);
  const longitude = Number(document.x);
  const latitude = Number(document.y);

  if (
    !/^\d{10}$/.test(code) ||
    !type ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return null;
  }

  return {
    code,
    fullName: [address.region_1depth_name, address.region_2depth_name, name].filter(Boolean).join(" "),
    latitude,
    longitude,
    name,
    type,
  };
}

export function parseKakaoRegionSearchResponse(payload: unknown): KakaoRegion[] | null {
  if (!isRecord(payload) || !Array.isArray(payload.documents)) {
    return null;
  }

  const regions = new Map<string, KakaoRegion>();
  for (const document of payload.documents) {
    const region = parseRegionDocument(document);
    if (region) regions.set(region.code, region);
  }

  return [...regions.values()];
}

export function parseKakaoCoordinateRegionResponse(payload: unknown): { code: string; fullName: string } | null {
  if (!isRecord(payload) || !Array.isArray(payload.documents)) {
    return null;
  }

  for (const document of payload.documents) {
    if (
      !isRecord(document) ||
      document.region_type !== "B" ||
      typeof document.code !== "string" ||
      typeof document.region_1depth_name !== "string" ||
      typeof document.region_2depth_name !== "string" ||
      typeof document.region_3depth_name !== "string"
    ) {
      continue;
    }

    const name = document.region_3depth_name.trim();
    if (!getRegionType(name) || !/^\d{10}$/.test(document.code)) {
      continue;
    }

    const code = name.endsWith("읍") || name.endsWith("면") ? `${document.code.slice(0, 8)}00` : document.code;
    return {
      code,
      fullName: [document.region_1depth_name, document.region_2depth_name, name].filter(Boolean).join(" "),
    };
  }

  return null;
}

export function getRelatedRegionQueries(places: KakaoPlace[]): string[] {
  const counts = new Map<string, { count: number; index: number }>();

  places.forEach((place, index) => {
    const parts = place.parcelAddress?.split(/\s+/) ?? [];
    let localityIndex = -1;
    for (let partIndex = parts.length - 1; partIndex >= 0; partIndex -= 1) {
      if (getRegionType(parts[partIndex])) {
        localityIndex = partIndex;
        break;
      }
    }
    if (localityIndex < 0) return;

    const query = parts.slice(0, localityIndex + 1).join(" ");
    const current = counts.get(query);
    counts.set(query, { count: (current?.count ?? 0) + 1, index: current?.index ?? index });
  });

  return [...counts]
    .sort(([, a], [, b]) => b.count - a.count || a.index - b.index)
    .slice(0, 3)
    .map(([query]) => query);
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

  const url = new URL(KAKAO_KEYWORD_URL);
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

async function fetchKakaoRegions(query: string, apiKey: string) {
  const url = new URL(KAKAO_ADDRESS_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("size", "30");

  const response = await fetch(url, {
    cache: "no-store",
    headers: { Authorization: `KakaoAK ${apiKey}` },
    signal: AbortSignal.timeout(5_000),
  });
  return response.ok ? parseKakaoRegionSearchResponse(await response.json()) : null;
}

export async function searchKakaoRegions(value: string): Promise<KakaoRegionSearchResult> {
  const queryResult = validateKakaoQuery(value);

  if (!queryResult.valid) {
    return { error: queryResult.error };
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return { error: "지역 검색 설정이 필요합니다. 관리자에게 문의해 주세요." };
  }

  try {
    const regions = await fetchKakaoRegions(queryResult.query, apiKey);
    if (!regions) return { error: "지역을 검색하지 못했습니다. 잠시 후 다시 시도해 주세요." };
    if (regions.length) return { regions, related: false };

    const placesResult = await searchKakaoPlaces(queryResult.query);
    if (!placesResult.places) return { regions: [], related: false };

    const relatedResults = await Promise.all(
      getRelatedRegionQueries(placesResult.places).map((query) => fetchKakaoRegions(query, apiKey)),
    );
    const relatedRegions = new Map<string, KakaoRegion>();
    for (const result of relatedResults) {
      for (const region of result ?? []) relatedRegions.set(region.code, region);
    }

    return { regions: [...relatedRegions.values()], related: relatedRegions.size > 0 };
  } catch {
    return { error: "지역을 검색하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

export async function resolveKakaoRegion(longitude: number, latitude: number): Promise<KakaoRegion | null> {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return null;
  }

  const url = new URL(KAKAO_COORD_REGION_URL);
  url.searchParams.set("x", String(longitude));
  url.searchParams.set("y", String(latitude));

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Authorization: `KakaoAK ${apiKey}` },
      signal: AbortSignal.timeout(5_000),
    });
    const location = response.ok ? parseKakaoCoordinateRegionResponse(await response.json()) : null;
    if (!location) return null;

    const result = await searchKakaoRegions(location.fullName);
    return "regions" in result ? (result.regions.find((region) => region.code === location.code) ?? null) : null;
  } catch {
    return null;
  }
}
