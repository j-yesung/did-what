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
};

export type KakaoRegionSearchResult = { regions: KakaoRegion[]; related: boolean } | { error: string };

/**
 * 장소 검색을 좁히는 기준점. 행정 경계가 아니라 거리로 좁힌다.
 * 같은 시 안에서도 옆 동이 안 나오거나, 바로 옆 시·군에 잠깐 들른 곳이 빠지는 걸 막는다.
 */
export type KakaoSearchScope = { latitude: number; longitude: number };

/** 카카오 키워드 검색이 허용하는 최대 반경(미터). 더 넓힐 수 없다. */
const KAKAO_SEARCH_RADIUS = 20_000;

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

/** 좌표 한 짝이 온전할 때만 기준점으로 인정한다. 빈 문자열이나 null이 0으로 둔갑하지 않도록 숫자 변환을 좁혀 둔다. */
export function normalizeKakaoScope(latitudeValue: unknown, longitudeValue: unknown): KakaoSearchScope | null {
  const toNumber = (value: unknown) =>
    typeof value === "number" || (typeof value === "string" && value.trim()) ? Number(value) : Number.NaN;
  const latitude = toNumber(latitudeValue);
  const longitude = toNumber(longitudeValue);

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
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

/** 주소에서 잘라낼 지점을 찾을 때 쓴다. "72-1" 같은 지번과 구분해야 해서 여기서는 접미사로 좁혀 본다. */
function isLocalityName(name: string): boolean {
  return /(?:동|읍|면|\d가)$/.test(name);
}

/** 시·군·구가 없는 세종은 읍·면·동, 나머지는 시·군·구 단위로 통일한다. */
function toDistrict(code: string, depth1: string, depth2: string, depth3: string) {
  const province = depth1.trim();
  const district = depth2.trim();
  const locality = depth3.trim();

  if ((!district && !locality) || !/^\d{10}$/.test(code)) return null;

  const name = district || locality;
  if (!province || !name) return null;

  return {
    code: district ? `${code.slice(0, 5)}00000` : `${code.slice(0, 8)}00`,
    fullName: `${province} ${name}`,
    name,
  };
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

  const district = toDistrict(
    address.b_code.trim(),
    address.region_1depth_name,
    address.region_2depth_name,
    address.region_3depth_name,
  );
  const longitude = Number(document.x);
  const latitude = Number(document.y);

  if (
    !district ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return null;
  }

  return { ...district, latitude, longitude };
}

export function parseKakaoRegionSearchResponse(payload: unknown): KakaoRegion[] | null {
  if (!isRecord(payload) || !Array.isArray(payload.documents)) {
    return null;
  }

  /**
   * 같은 하위 지역의 문서는 하나로 합친다. 좌표는 먼저 온 문서 것을 남긴다.
   * 카카오가 검색어와 가까운 순으로 주므로, 행정구역 중심점보다 사용자가 찾던 곳에 가깝다.
   */
  const regions = new Map<string, KakaoRegion>();
  for (const document of payload.documents) {
    const region = parseRegionDocument(document);
    if (region && !regions.has(region.code)) regions.set(region.code, region);
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

    const district = toDistrict(
      document.code,
      document.region_1depth_name,
      document.region_2depth_name,
      document.region_3depth_name,
    );
    if (district) return { code: district.code, fullName: district.fullName };
  }

  return null;
}

export function getRelatedRegionQueries(places: KakaoPlace[]): string[] {
  const counts = new Map<string, { count: number; index: number }>();

  places.forEach((place, index) => {
    const parts = place.parcelAddress?.split(/\s+/) ?? [];
    let localityIndex = -1;
    for (let partIndex = parts.length - 1; partIndex >= 0; partIndex -= 1) {
      if (isLocalityName(parts[partIndex])) {
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
  scope?: KakaoSearchScope | null,
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
