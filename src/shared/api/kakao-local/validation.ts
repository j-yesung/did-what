import type { KakaoSearchScope } from "./types.ts";

export const KAKAO_SEARCH_MAX_PAGE = 45;

export const validateKakaoQuery = (value: string): { valid: true; query: string } | { valid: false; error: string } => {
  const query = value.trim();

  if (query.length < 1 || query.length > 100) {
    return { error: "검색어는 1자 이상 100자 이하로 입력해 주세요.", valid: false };
  }

  return { query, valid: true };
};

export const validateKakaoPlaceId = (value: string): { valid: true; id: string } | { valid: false; error: string } => {
  const id = value.trim();

  if (!/^\d{1,100}$/.test(id)) {
    return { error: "선택한 장소를 확인할 수 없습니다. 다시 검색해 주세요.", valid: false };
  }

  return { id, valid: true };
};

/** 좌표 한 짝이 온전할 때만 기준점으로 인정한다. 빈 문자열이나 null이 0으로 둔갑하지 않도록 숫자 변환을 좁혀 둔다. */
export const normalizeKakaoScope = (latitudeValue: unknown, longitudeValue: unknown): KakaoSearchScope | null => {
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
};

export const normalizeKakaoPage = (value: unknown): number => {
  const page = typeof value === "number" || typeof value === "string" ? Number(value) : 1;

  return Number.isInteger(page) && page >= 1 && page <= KAKAO_SEARCH_MAX_PAGE ? page : 1;
};
