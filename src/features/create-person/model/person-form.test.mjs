import { validatePersonName } from "./person-form.ts";
import assert from "node:assert/strict";

assert.deepEqual(validatePersonName("  다연  "), { name: "다연" });
assert.deepEqual(validatePersonName(" "), { error: "이름은 1자 이상 50자 이하로 입력해 주세요." });
assert.deepEqual(validatePersonName("가".repeat(51)), { error: "이름은 1자 이상 50자 이하로 입력해 주세요." });
