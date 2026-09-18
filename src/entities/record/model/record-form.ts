import type { KakaoSearchScope } from "@/shared/api/kakao-local";
import { isIsoDate } from "@/shared/lib/validation/is-iso-date";
import { isUuid } from "@/shared/lib/validation/is-uuid";

import { isRecordCategory, type RecordCategory } from "./category";
import { isRecordWeather, type RecordWeather } from "./weather";

export type RecordPlaceReference =
  | { kind: "existing"; placeId: string; save: boolean }
  | {
      kind: "kakao";
      page: number;
      providerPlaceId: string;
      query: string;
      save: boolean;
      /** 그 장소를 찾을 때 쓴 기준점. 저장 시점에 같은 검색을 재현하려면 함께 있어야 한다. */
      scope: KakaoSearchScope | null;
    };

export type RecordFieldErrors = Partial<
  Record<
    "recordedAt" | "recordedUntil" | "regionCode" | "places" | "weather" | "activity" | "memo" | "category",
    string
  >
>;

export type RecordInput = {
  recordedAt: string;
  recordedUntil?: string;
  regionCode: string;
  regionLabel: string;
  regionName: string;
  places: RecordPlaceReference[];
  weather: RecordWeather;
  activity: string;
  memo?: string;
  category: RecordCategory;
};

type RecordInputValues = {
  recordedAt: string;
  recordedUntil: string;
  regionCode: string;
  regionLabel: string;
  regionName: string;
  places: string;
  weather: string;
  activity: string;
  memo: string;
  category: string;
};

export const readRecordInput = (formData: FormData): RecordInputValues => {
  return {
    activity: String(formData.get("activity") ?? ""),
    category: String(formData.get("category") ?? ""),
    memo: String(formData.get("memo") ?? ""),
    places: String(formData.get("places") ?? "[]"),
    recordedAt: String(formData.get("recordedAt") ?? ""),
    recordedUntil: String(formData.get("recordedUntil") ?? ""),
    regionCode: String(formData.get("regionCode") ?? ""),
    regionLabel: String(formData.get("regionLabel") ?? ""),
    regionName: String(formData.get("regionName") ?? ""),
    weather: String(formData.get("weather") ?? ""),
  };
};

const REGION_CODE_PATTERN = /^\d{10}$/;
const KAKAO_PLACE_ID_PATTERN = /^\d{1,100}$/;
const MAX_VISITED_PLACES = 10;

/** 지역을 고르기 전에 검색했다면 기준점이 없다. 없는 경우와 형태가 깨진 경우를 구분해야 해서 실패는 false로 돌려준다. */
const parseScope = (value: unknown): KakaoSearchScope | null | false => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") return false;

  const { latitude, longitude } = value as { latitude?: unknown; longitude?: unknown };
  if (
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return false;
  }

  return { latitude, longitude };
};

const parsePlaces = (value: string): RecordPlaceReference[] | null => {
  try {
    const parsed: unknown = JSON.parse(value || "[]");
    if (!Array.isArray(parsed) || parsed.length > MAX_VISITED_PLACES) return null;

    const places = new Map<string, RecordPlaceReference>();
    for (const item of parsed) {
      if (!item || typeof item !== "object" || !("kind" in item) || !("save" in item)) return null;

      if (item.kind === "existing" && "placeId" in item && typeof item.placeId === "string" && isUuid(item.placeId)) {
        const key = `existing:${item.placeId}`;
        const previous = places.get(key);
        places.set(key, { kind: "existing", placeId: item.placeId, save: Boolean(item.save || previous?.save) });
        continue;
      }

      if (
        item.kind === "kakao" &&
        "providerPlaceId" in item &&
        "query" in item &&
        "page" in item &&
        typeof item.providerPlaceId === "string" &&
        KAKAO_PLACE_ID_PATTERN.test(item.providerPlaceId) &&
        typeof item.query === "string" &&
        item.query.trim().length >= 1 &&
        item.query.trim().length <= 100 &&
        typeof item.page === "number" &&
        Number.isInteger(item.page) &&
        item.page >= 1 &&
        item.page <= 45
      ) {
        const scope = parseScope("scope" in item ? item.scope : null);
        if (scope === false) return null;

        const key = `kakao:${item.providerPlaceId}`;
        const previous = places.get(key);
        places.set(key, {
          kind: "kakao",
          page: item.page,
          providerPlaceId: item.providerPlaceId,
          query: item.query.trim(),
          save: Boolean(item.save || previous?.save),
          scope,
        });
        continue;
      }

      return null;
    }

    return [...places.values()];
  } catch {
    return null;
  }
};

export const validateRecordInput = (
  values: RecordInputValues,
): { data: RecordInput; fieldErrors?: never } | { data?: never; fieldErrors: RecordFieldErrors } => {
  const fieldErrors: RecordFieldErrors = {};
  const regionLabel = values.regionLabel.trim();
  const regionName = values.regionName.trim();
  const places = parsePlaces(values.places);
  const activity = values.activity.trim();
  const memo = values.memo.trim();

  if (!isIsoDate(values.recordedAt)) {
    fieldErrors.recordedAt = "올바른 날짜를 입력해 주세요.";
  }

  if (values.recordedUntil && (!isIsoDate(values.recordedUntil) || values.recordedUntil < values.recordedAt)) {
    fieldErrors.recordedUntil = "종료일은 시작일과 같거나 이후여야 해요.";
  }

  if (
    !REGION_CODE_PATTERN.test(values.regionCode) ||
    regionLabel.length < 1 ||
    regionLabel.length > 100 ||
    regionName.length < 1 ||
    regionName.length > 200
  ) {
    fieldErrors.regionCode = "목록에서 지역을 선택해 주세요.";
  }

  if (!places) {
    fieldErrors.places = `방문 장소는 ${MAX_VISITED_PLACES}곳까지 선택할 수 있어요.`;
  }

  if (!isRecordWeather(values.weather)) {
    fieldErrors.weather = "날씨를 선택해 주세요.";
  }

  if (activity.length < 1 || activity.length > 120) {
    fieldErrors.activity = "한 일은 1자 이상 120자 이하로 입력해 주세요.";
  }

  if (memo.length > 500) {
    fieldErrors.memo = "메모는 500자 이하로 입력해 주세요.";
  }

  if (!isRecordCategory(values.category)) {
    fieldErrors.category = "카테고리를 선택해 주세요.";
  }

  if (
    Object.keys(fieldErrors).length > 0 ||
    !places ||
    !isRecordWeather(values.weather) ||
    !isRecordCategory(values.category)
  ) {
    return { fieldErrors };
  }

  return {
    data: {
      recordedAt: values.recordedAt,
      ...(values.recordedUntil && values.recordedUntil !== values.recordedAt
        ? { recordedUntil: values.recordedUntil }
        : {}),
      regionCode: values.regionCode,
      regionLabel,
      regionName,
      places,
      weather: values.weather,
      activity,
      ...(memo ? { memo } : {}),
      category: values.category,
    },
  };
};
