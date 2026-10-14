import { isRecordCategory, type RecordCategory } from "@/entities/record/model/category";
import { isIsoDate } from "@/shared/lib/validation/is-iso-date";

export type RecordSort = "recent" | "oldest";

export type RecordFilters = {
  category: RecordCategory | "";
  from: string;
  query: string;
  sort: RecordSort;
  to: string;
};

export type RecordSearchParams = Record<string, string | string[] | undefined>;

const MAX_QUERY_LENGTH = 100;

/**
 * PostgREST의 or() 필터는 쉼표와 괄호로 조건을 나누고 ilike는 %를 와일드카드로 쓴다.
 * 검색어에 그대로 들어가면 조건이 깨지므로 미리 걷어낸다.
 */
const RESERVED_PATTERN = /[,()%"\\*]/g;

const readParam = (value: string | string[] | undefined) => {
  return typeof value === "string" ? value.trim() : "";
};

const readDate = (value: string | string[] | undefined) => {
  const date = readParam(value);
  return isIsoDate(date) ? date : "";
};

export const parseRecordFilters = (params: RecordSearchParams): RecordFilters => {
  const category = readParam(params.category);
  const query = readParam(params.q).replace(RESERVED_PATTERN, "").trim().slice(0, MAX_QUERY_LENGTH);
  const from = readDate(params.from);
  const to = readDate(params.to);
  const swap = Boolean(from && to) && from > to;

  return {
    category: isRecordCategory(category) ? category : "",
    from: swap ? to : from,
    query,
    sort: readParam(params.sort) === "oldest" ? "oldest" : "recent",
    to: swap ? from : to,
  };
};

// 기본값(검색어 없음·기간 없음·최신순)이 아니면 목록이 걸러진 상태다.
export const hasRecordFilters = (filters: RecordFilters) => {
  return Boolean(filters.category || filters.query || filters.from || filters.to) || filters.sort !== "recent";
};

export const setRecordFilterParams = (searchParams: URLSearchParams, filters: RecordFilters) => {
  const params = new URLSearchParams(searchParams);
  const values = {
    category: filters.category,
    from: filters.from,
    q: filters.query,
    sort: filters.sort === "recent" ? "" : filters.sort,
    to: filters.to,
  };

  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }

  return params;
};
