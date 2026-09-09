export const MIN_MEMBER_COUNT = 2;

export function normalizeMemberNames(values: string[]) {
  return values.map((value) => value.trim());
}

export function validateMemberNames(values: string[]) {
  const names = normalizeMemberNames(values);

  if (names.length < MIN_MEMBER_COUNT) return "함께 사용하는 사람을 두 명 이상 입력해 주세요.";
  if (names.some((name) => !name || name.length > 100)) return "이름은 1자 이상 100자 이하로 입력해 주세요.";

  const normalized = names.map((name) => name.toLowerCase());
  if (new Set(normalized).size !== normalized.length) return "서로 다른 이름을 입력해 주세요.";

  return null;
}
