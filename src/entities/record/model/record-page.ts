import type { RecordFilters, RecordSort } from "./record-filters";

export const RECORD_PAGE_SIZE = 20;

export type RecordCursor = {
  createdAt: string;
  id: string;
  recordedAt: string;
};

type CursorRecord = {
  created_at: string;
  id: string;
  recorded_at: string;
};

/** 부등호로 비교한다. localeCompare는 기호 순서가 달라 소수점 없는 시각을 소수점 있는 시각 뒤로 보낸다. */
const compareDescending = (a: string, b: string) => (a < b ? 1 : a > b ? -1 : 0);

/** 목록 조회와 같은 최신순. recorded_at, created_at, id 순서로 내림차순 비교한다. */
export const compareRecordsByRecent = (a: CursorRecord, b: CursorRecord) =>
  compareDescending(a.recorded_at, b.recorded_at) ||
  compareDescending(a.created_at, b.created_at) ||
  compareDescending(a.id, b.id);

export const getRecordCursor = (record: CursorRecord): RecordCursor => {
  return { createdAt: record.created_at, id: record.id, recordedAt: record.recorded_at };
};

export const getRecordCursorFilter = (cursor: RecordCursor, sort: RecordSort) => {
  const operator = sort === "oldest" ? "gt" : "lt";
  const { createdAt, id, recordedAt } = cursor;

  return [
    `recorded_at.${operator}.${recordedAt}`,
    `and(recorded_at.eq.${recordedAt},created_at.${operator}.${createdAt})`,
    `and(recorded_at.eq.${recordedAt},created_at.eq.${createdAt},id.${operator}.${id})`,
  ].join(",");
};

export const getRecordPeriodFilter = ({ from, to }: Pick<RecordFilters, "from" | "to">) => {
  return {
    from: from ? `recorded_until.gte.${from},and(recorded_until.is.null,recorded_at.gte.${from})` : null,
    to: to || null,
  };
};
