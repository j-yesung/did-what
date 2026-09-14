import { getCreatedAtCursorFilter } from "@/shared/lib/pagination/get-created-at-cursor-filter";

import assert from "node:assert/strict";
import test from "node:test";

test("같은 생성 시각의 항목도 id를 기준으로 이어서 조회한다", () => {
  assert.equal(
    getCreatedAtCursorFilter({ createdAt: "2026-09-14T06:00:00+00:00", id: "item-a" }),
    "created_at.lt.2026-09-14T06:00:00+00:00,and(created_at.eq.2026-09-14T06:00:00+00:00,id.lt.item-a)",
  );
});
