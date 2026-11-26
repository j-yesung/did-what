import {
  isRecordCategories,
  normalizeRecordCategories,
  type RecordCategory,
} from "@/entities/record/model/options/category";
import { isRecordWeather, type RecordWeather } from "@/entities/record/model/options/weather";
import { getRecordRegionKey } from "@/entities/record/model/region/record-region";
import type { RecordFieldErrors } from "@/entities/record/model/types";
import type { KakaoSearchScope } from "@/shared/api/kakao-local";
import { KAKAO_SEARCH_MAX_PAGE, validateKakaoPlaceId, validateKakaoQuery } from "@/shared/api/kakao-local/validation";
import { isIsoDate } from "@/shared/lib/validation/is-iso-date";
import { isUuid } from "@/shared/lib/validation/is-uuid";

import { MAX_ACTIVITY_LENGTH, MAX_MEMO_LENGTH, MAX_VISITED_PLACES, MAX_VISITED_REGIONS } from "./limits";

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

/** 사용자가 직접 고른 방문 지역. 좌표는 서버가 다시 조회하므로 보내지 않는다. */
type RecordRegionReference = {
  code: string;
  label: string;
  name: string;
};

export type RecordInput = {
  recordedAt: string;
  recordedUntil?: string;
  regions: RecordRegionReference[];
  places: RecordPlaceReference[];
  weather: RecordWeather;
  activity: string;
  memo?: string;
  category: RecordCategory[];
};

type RecordInputValues = {
  recordedAt: string;
  recordedUntil: string;
  regions: string;
  places: string;
  weather: string;
  activity: string;
  memo: string;
  category: string;
};

export const readRecordInput = (formData: FormData): RecordInputValues => {
  return {
    activity: String(formData.get("activity") ?? ""),
    category: String(formData.get("category") ?? "[]"),
    memo: String(formData.get("memo") ?? ""),
    places: String(formData.get("places") ?? "[]"),
    recordedAt: String(formData.get("recordedAt") ?? ""),
    recordedUntil: String(formData.get("recordedUntil") ?? ""),
    regions: String(formData.get("regions") ?? "[]"),
    weather: String(formData.get("weather") ?? ""),
  };
};

const REGION_CODE_PATTERN = /^\d{10}$/;

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
        validateKakaoPlaceId(item.providerPlaceId).valid &&
        typeof item.query === "string" &&
        validateKakaoQuery(item.query).valid &&
        typeof item.page === "number" &&
        Number.isInteger(item.page) &&
        item.page >= 1 &&
        item.page <= KAKAO_SEARCH_MAX_PAGE
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

/** 같은 지역이라도 표시명이 다르면 보존한다. */
const parseRegions = (value: string): RecordRegionReference[] | null => {
  try {
    const parsed: unknown = JSON.parse(value || "[]");
    if (!Array.isArray(parsed) || parsed.length > MAX_VISITED_REGIONS) return null;

    const regions = new Map<string, RecordRegionReference>();
    for (const item of parsed) {
      if (!item || typeof item !== "object" || !("code" in item) || !("label" in item) || !("name" in item)) {
        return null;
      }

      const { code, label, name } = item as { code: unknown; label: unknown; name: unknown };
      if (typeof code !== "string" || typeof label !== "string" || typeof name !== "string") return null;

      const trimmedLabel = label.trim();
      const trimmedName = name.trim();
      if (
        !REGION_CODE_PATTERN.test(code) ||
        trimmedLabel.length < 1 ||
        trimmedLabel.length > 100 ||
        trimmedName.length < 1 ||
        trimmedName.length > 200
      ) {
        return null;
      }

      const key = getRecordRegionKey({ code, label: trimmedLabel });
      if (!regions.has(key)) regions.set(key, { code, label: trimmedLabel, name: trimmedName });
    }

    return [...regions.values()];
  } catch {
    return null;
  }
};

const validateRecordDates = ({
  recordedAt,
  recordedUntil,
}: {
  recordedAt: string;
  recordedUntil: string;
}): RecordFieldErrors => {
  const fieldErrors: RecordFieldErrors = {};
  if (!isIsoDate(recordedAt)) fieldErrors.recordedAt = "올바른 날짜를 입력해 주세요.";
  if (recordedUntil && (!isIsoDate(recordedUntil) || recordedUntil < recordedAt)) {
    fieldErrors.recordedUntil = "종료일은 시작일과 같거나 이후여야 해요.";
  }
  return fieldErrors;
};

const validateRecordContent = ({ activity, memo }: { activity: string; memo: string }): RecordFieldErrors => {
  const fieldErrors: RecordFieldErrors = {};
  const title = activity.trim();
  if (title.length < 1 || title.length > MAX_ACTIVITY_LENGTH) {
    fieldErrors.activity = `기록 제목은 1자 이상 ${MAX_ACTIVITY_LENGTH}자 이하로 입력해 주세요.`;
  }
  if (memo.trim().length > MAX_MEMO_LENGTH) fieldErrors.memo = `메모는 ${MAX_MEMO_LENGTH}자 이하로 입력해 주세요.`;
  return fieldErrors;
};

export const validateRecordInput = (
  values: RecordInputValues,
): { data: RecordInput; fieldErrors?: never } | { data?: never; fieldErrors: RecordFieldErrors } => {
  const fieldErrors: RecordFieldErrors = { ...validateRecordDates(values), ...validateRecordContent(values) };
  const regions = parseRegions(values.regions);
  const places = parsePlaces(values.places);
  const activity = values.activity.trim();
  const memo = values.memo.trim();
  let category: unknown;
  try {
    category = JSON.parse(values.category);
  } catch {
    category = null;
  }

  if (!regions) {
    fieldErrors.regions = `방문 지역은 ${MAX_VISITED_REGIONS}곳까지 선택할 수 있어요.`;
  } else if (regions.length === 0 && (!places || places.length === 0)) {
    // 장소를 고르면 그 지역이 서버에서 따라 붙으므로 지역을 직접 고르지 않아도 된다.
    fieldErrors.regions = "방문 지역을 1곳 이상 선택해 주세요.";
  }

  if (!places) {
    fieldErrors.places = `방문 장소는 ${MAX_VISITED_PLACES}곳까지 선택할 수 있어요.`;
  }

  if (!isRecordWeather(values.weather)) {
    fieldErrors.weather = "날씨를 선택해 주세요.";
  }

  if (!isRecordCategories(category)) {
    fieldErrors.category = "카테고리를 다시 선택해 주세요.";
  }

  if (
    Object.keys(fieldErrors).length > 0 ||
    !regions ||
    !places ||
    !isRecordWeather(values.weather) ||
    !isRecordCategories(category)
  ) {
    return { fieldErrors };
  }

  return {
    data: {
      recordedAt: values.recordedAt,
      ...(values.recordedUntil && values.recordedUntil !== values.recordedAt
        ? { recordedUntil: values.recordedUntil }
        : {}),
      regions,
      places,
      weather: values.weather,
      activity,
      ...(memo ? { memo } : {}),
      category: normalizeRecordCategories(category),
    },
  };
};
