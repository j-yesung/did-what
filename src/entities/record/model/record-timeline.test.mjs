import { formatRecordTimelineDate, groupRecordsByDate } from "@/entities/record/model/record-timeline";

import assert from "node:assert/strict";
import test from "node:test";

test("같은 시작일의 기록을 묶고 연도 경계와 기록 순서를 보존한다", () => {
  const records = [
    { id: "first", recorded_at: "2026-01-01", recorded_until: null },
    { id: "period", recorded_at: "2026-01-01", recorded_until: "2026-01-03" },
    { id: "last-year", recorded_at: "2025-12-31", recorded_until: "2026-01-02" },
  ];
  const original = structuredClone(records);
  assert.deepEqual(groupRecordsByDate(records), [
    { date: "2026-01-01", records: records.slice(0, 2) },
    { date: "2025-12-31", records: [records[2]] },
  ]);
  assert.deepEqual(records, original);
  assert.deepEqual(groupRecordsByDate([]), []);
});

test("타임라인 날짜는 짧은 기간을 표시하고 연도를 넘기면 양쪽 연도를 보존한다", () => {
  assert.equal(formatRecordTimelineDate("2026-10-04"), "10월 4일 일요일");
  assert.equal(formatRecordTimelineDate("2026-10-04", "2026-10-04"), "10월 4일 일요일");
  assert.equal(formatRecordTimelineDate("2026-09-28", "2026-09-30"), "9.28 – 9.30");
  assert.equal(formatRecordTimelineDate("2026-09-30", "2026-10-02"), "9.30 – 10.2");
  assert.equal(formatRecordTimelineDate("2025-12-31", "2026-01-02"), "2025.12.31 – 2026.1.2");
});
