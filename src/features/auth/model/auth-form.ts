export type AuthFieldErrors = Partial<Record<"displayName" | "email" | "password" | "passwordConfirm", string>>;

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: AuthFieldErrors;
};

export const INITIAL_AUTH_STATE: AuthActionState = { status: "idle" };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginInput(email: string, password: string): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  if (!EMAIL_PATTERN.test(email)) {
    errors.email = "올바른 이메일 주소를 입력해 주세요.";
  }

  if (password.length < 6) {
    errors.password = "비밀번호는 6자 이상이어야 합니다.";
  }

  return errors;
}

export function validateSignupInput(
  displayName: string,
  email: string,
  password: string,
  passwordConfirm: string,
): AuthFieldErrors {
  const errors = validateLoginInput(email, password);

  if (displayName.length < 1 || displayName.length > 100) {
    errors.displayName = "표시 이름은 1자 이상 100자 이하여야 합니다.";
  }

  if (password !== passwordConfirm) {
    errors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
  }

  return errors;
}
