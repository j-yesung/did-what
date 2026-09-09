import { isIsoDate } from "@/shared/lib/validation/is-iso-date";

export type RecordSort = "recent" | "oldest";

export type RecordFilters = {
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

function readParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function readDate(value: string | string[] | undefined) {
  const date = readParam(value);
  return isIsoDate(date) ? date : "";
}

export function parseRecordFilters(params: RecordSearchParams): RecordFilters {
  const query = readParam(params.q).replace(RESERVED_PATTERN, "").trim().slice(0, MAX_QUERY_LENGTH);
  const from = readDate(params.from);
  const to = readDate(params.to);
  const swap = Boolean(from && to) && from > to;

  return {
    from: swap ? to : from,
    query,
    sort: readParam(params.sort) === "oldest" ? "oldest" : "recent",
    to: swap ? from : to,
  };
}

// 기본값(검색어 없음·기간 없음·최신순)이 아니면 목록이 걸러진 상태다.
export function hasRecordFilters(filters: RecordFilters) {
  return Boolean(filters.query || filters.from || filters.to) || filters.sort !== "recent";
}

// 지금 필터를 유지한 채 일부만 바꾼 목록 주소를 만든다.
export function buildRecordsHref(filters: RecordFilters, overrides: Partial<RecordFilters> = {}) {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (next.query) params.set("q", next.query);
  if (next.from) params.set("from", next.from);
  if (next.to) params.set("to", next.to);
  if (next.sort !== "recent") params.set("sort", next.sort);

  const search = params.toString();
  return search ? `/records?${search}` : "/records";
}
