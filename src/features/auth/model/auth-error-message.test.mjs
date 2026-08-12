import { getLoginErrorMessage, getSignupErrorMessage } from "./auth-error-message.ts";
import assert from "node:assert/strict";

assert.equal(getLoginErrorMessage("invalid_credentials"), "이메일 또는 비밀번호를 확인해 주세요.");
assert.equal(getLoginErrorMessage("email_not_confirmed"), "이메일 인증을 먼저 완료해 주세요.");
assert.match(getLoginErrorMessage("unknown_code"), /로그인 중 문제/);
assert.match(getLoginErrorMessage(undefined), /로그인 중 문제/);

assert.equal(getSignupErrorMessage("weak_password"), "조금 더 안전한 비밀번호를 사용해 주세요.");
assert.match(getSignupErrorMessage("unknown_code"), /회원가입 중 문제/);
