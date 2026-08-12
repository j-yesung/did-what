export function getLoginErrorMessage(code?: string) {
  if (code === "email_not_confirmed") {
    return "이메일 인증을 먼저 완료해 주세요.";
  }

  if (code === "invalid_credentials") {
    return "이메일 또는 비밀번호를 확인해 주세요.";
  }

  return "로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

export function getSignupErrorMessage(code?: string) {
  if (code === "weak_password") {
    return "조금 더 안전한 비밀번호를 사용해 주세요.";
  }

  if (code === "over_email_send_rate_limit") {
    return "인증 메일 요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  }

  return "회원가입 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}
