import { shouldShowAppShell } from "@/shared/lib/navigation/app-shell";

import assert from "node:assert/strict";
import test from "node:test";

const cookies = ["sb-test-auth-token"];

test("세션 쿠키가 있는 홈 문서만 로딩 화면을 먼저 보낸다", () => {
  const headers = new Headers({ accept: "text/html,application/xhtml+xml" });
  assert.equal(shouldShowAppShell("GET", "/", headers, cookies), true);
  assert.equal(shouldShowAppShell("GET", "/", headers, ["sb-test-auth-token.0", "sb-test-auth-token.1"]), true);
  assert.equal(shouldShowAppShell("GET", "/", headers, []), false);
  assert.equal(shouldShowAppShell("GET", "/", headers, ["did-what-member"]), false);
  assert.equal(shouldShowAppShell("GET", "/records", headers, cookies), false);
  assert.equal(shouldShowAppShell("POST", "/", headers, cookies), false);
  assert.equal(shouldShowAppShell("GET", "/", new Headers(), cookies), false);
});

test("홈 갱신·이동·미리 받기 요청은 기존 서버 인증 경로를 거친다", () => {
  for (const extra of [
    { rsc: "1" },
    { "next-router-prefetch": "1" },
    { purpose: "prefetch" },
    { "sec-purpose": "prefetch;prerender" },
  ]) {
    const headers = new Headers({ accept: "text/html", ...extra });
    assert.equal(shouldShowAppShell("GET", "/", headers, cookies), false);
  }
});
