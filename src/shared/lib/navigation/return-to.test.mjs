import { toSafeReturnTo, withReturnTo } from "@/shared/lib/navigation/return-to";

import assert from "node:assert/strict";
import test from "node:test";

test("앱 내부 경로만 돌아갈 주소로 받는다", () => {
  assert.equal(toSafeReturnTo("/records/1?from=notification"), "/records/1?from=notification");
  for (const value of [null, undefined, "", "records", "https://evil.com", "//evil.com", "/\\evil.com"]) {
    assert.equal(toSafeReturnTo(value), "/");
  }
});

test("홈이 아니면 returnTo 쿼리로 붙인다", () => {
  assert.equal(
    withReturnTo("/login", "/records/1?from=notification"),
    "/login?returnTo=%2Frecords%2F1%3Ffrom%3Dnotification",
  );
  assert.equal(withReturnTo("/login", "/"), "/login");
  assert.equal(withReturnTo("/login", "//evil.com"), "/login");
});
