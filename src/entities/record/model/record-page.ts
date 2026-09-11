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
