import { formatRecordTimelineMonth, getRecordTimelineItemState } from "@/entities/record/model/record-timeline";

import assert from "node:assert/strict";
import test from "node:test";

test("같은 날짜는 하나로 묶고 월이 바뀌는 지점을 표시한다", () => {
  const records = [
    { recorded_at: "2026-09-17" },
    { recorded_at: "2026-09-17" },
    { recorded_at: "2026-09-14" },
    { recorded_at: "2026-08-30" },
  ];

  assert.deepEqual(
    records.map((_, index) => getRecordTimelineItemState(records, index)),
    [
      { endsDate: false, startsDate: true, startsMonth: true },
      { endsDate: true, startsDate: false, startsMonth: false },
      { endsDate: true, startsDate: true, startsMonth: false },
      { endsDate: true, startsDate: true, startsMonth: true },
    ],
  );
  assert.equal(formatRecordTimelineMonth(records[0].recorded_at), "2026년 9월");
});

test("기록 하나만 있어도 날짜의 시작과 끝을 표시한다", () => {
  assert.deepEqual(getRecordTimelineItemState([{ recorded_at: "2026-10-04" }], 0), {
    endsDate: true,
    startsDate: true,
    startsMonth: true,
  });
});
