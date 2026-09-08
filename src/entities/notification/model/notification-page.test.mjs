import { getNotificationCursorFilter } from "@/entities/notification/model/notification-page";

import assert from "node:assert/strict";
import test from "node:test";

test("같은 생성 시각의 알림도 id를 기준으로 이어서 조회한다", () => {
  assert.equal(
    getNotificationCursorFilter({ createdAt: "2026-09-08T03:00:00+00:00", id: 42 }),
    "created_at.lt.2026-09-08T03:00:00+00:00,and(created_at.eq.2026-09-08T03:00:00+00:00,id.lt.42)",
  );
});
