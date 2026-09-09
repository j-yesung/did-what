import { normalizeMemberNames, validateMemberNames } from "@/features/member/setup-members/model/member-setup";

import assert from "node:assert/strict";
import test from "node:test";

test("구성원 이름의 앞뒤 공백을 제거한다", () => {
  assert.deepEqual(normalizeMemberNames([" 나 ", " 상대방  "]), ["나", "상대방"]);
});

test("두 명 미만과 중복 이름을 거부한다", () => {
  assert.match(validateMemberNames(["나"]) ?? "", /두 명 이상/);
  assert.match(validateMemberNames(["우리", " 우리 "]) ?? "", /서로 다른/);
});

test("구성원 수에는 상한을 두지 않는다", () => {
  const names = Array.from({ length: 20 }, (_, index) => `구성원 ${index + 1}`);
  assert.equal(validateMemberNames(names), null);
});
