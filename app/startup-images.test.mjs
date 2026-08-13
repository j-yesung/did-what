import { APPLE_STARTUP_IMAGES } from "./startup-images.ts";
import assert from "node:assert/strict";
import test from "node:test";

test("iOS 시작 이미지는 기기별 라이트·다크 쌍을 제공한다", () => {
  assert.equal(APPLE_STARTUP_IMAGES.length, 18);
  assert.ok(APPLE_STARTUP_IMAGES.some(({ url }) => url === "/splash/apple-splash-1206x2622.png"));
  assert.ok(APPLE_STARTUP_IMAGES.some(({ url }) => url === "/splash/apple-splash-dark-1206x2622.png"));
});
