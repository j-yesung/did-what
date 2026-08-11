import { validateLoginInput, validateSignupInput } from "./auth-model.ts";
import assert from "node:assert/strict";

assert.deepEqual(validateLoginInput("invalid", "123"), {
  email: "올바른 이메일 주소를 입력해 주세요.",
  password: "비밀번호는 6자 이상이어야 합니다.",
});

assert.deepEqual(validateSignupInput("다연", "dayeon@example.com", "password", "password"), {});

assert.equal(
  validateSignupInput("다연", "dayeon@example.com", "password", "different").passwordConfirm,
  "비밀번호가 일치하지 않습니다.",
);
