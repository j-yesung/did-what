import { reverseRecordPages } from "@/pages/record/list/model/record-list-cache";

import assert from "node:assert/strict";
import test from "node:test";

test("전체 페이지를 반대 정렬의 단일 캐시 페이지로 뒤집는다", () => {
  assert.deepEqual(
    reverseRecordPages([
      {
        nextCursor: { recordedAt: "2026-09-01", createdAt: "2026-09-01T00:00:00.000Z", id: "2" },
        records: [{ id: "3" }, { id: "2" }],
      },
      { nextCursor: null, records: [{ id: "1" }] },
    ]),
    { pageParams: [null], pages: [{ nextCursor: null, records: [{ id: "1" }, { id: "2" }, { id: "3" }] }] },
  );
});
