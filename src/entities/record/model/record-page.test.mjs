import {
  compareRecordsByRecent,
  getRecordCursor,
  getRecordCursorFilter,
  getRecordPeriodFilter,
} from "@/entities/record/model/record-page";

import assert from "node:assert/strict";
import test from "node:test";

const record = {
  created_at: "2026-09-03T12:34:56.000Z",
  id: "00000000-0000-4000-8000-000000000001",
  recorded_at: "2026-09-01",
};

test("마지막 기록으로 안정적인 cursor 조건을 만든다", () => {
  const cursor = getRecordCursor(record);

  assert.equal(
    getRecordCursorFilter(cursor, "recent"),
    "recorded_at.lt.2026-09-01,and(recorded_at.eq.2026-09-01,created_at.lt.2026-09-03T12:34:56.000Z),and(recorded_at.eq.2026-09-01,created_at.eq.2026-09-03T12:34:56.000Z,id.lt.00000000-0000-4000-8000-000000000001)",
  );
  assert.match(getRecordCursorFilter(cursor, "oldest"), /recorded_at\.gt\.2026-09-01/);
});

test("기간 시작일은 여러 날 기록과 겹치는 기록을 포함한다", () => {
  assert.deepEqual(getRecordPeriodFilter({ from: "2026-08-01", to: "2026-08-31" }), {
    from: "recorded_until.gte.2026-08-01,and(recorded_until.is.null,recorded_at.gte.2026-08-01)",
    to: "2026-08-31",
  });
});

test("최신순은 날짜, 작성 시각, ID 순서로 비교한다", () => {
  const records = [
    { created_at: "2026-09-01T00:00:00+00:00", id: "a", recorded_at: "2026-09-01" },
    { created_at: "2026-09-01T00:00:00.5+00:00", id: "b", recorded_at: "2026-09-01" },
    { created_at: "2026-09-01T00:00:00.5+00:00", id: "c", recorded_at: "2026-09-01" },
    { created_at: "2026-08-01T00:00:00+00:00", id: "d", recorded_at: "2026-09-02" },
  ];

  assert.deepEqual(
    records.toSorted(compareRecordsByRecent).map(({ id }) => id),
    ["d", "c", "b", "a"],
  );
});
