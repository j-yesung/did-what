/**
 * 카테고리와 같은 색상군을 빌려 쓴다. 라이트·다크 값이 이미 토큰에 잡혀 있어 따로 관리할 색이 늘지 않는다.
 * Tailwind는 소스에 적힌 클래스만 찾으므로 조합하지 않고 그대로 적는다.
 */
const MEMBER_AVATAR_TONES = [
  "bg-category-date-subtle text-category-date",
  "bg-category-travel-subtle text-category-travel",
  "bg-category-daily-subtle text-category-daily",
  "bg-category-anniversary-subtle text-category-anniversary",
  "bg-category-gathering-subtle text-category-gathering",
] as const;

/** 같은 구성원은 어느 화면에서든 같은 색이어야 해서 난수 대신 id로 고른다. */
export const getMemberAvatarTone = (memberId: string) => {
  let hash = 0;
  for (const character of memberId) hash = (hash * 31 + (character.codePointAt(0) ?? 0)) % 9973;
  return MEMBER_AVATAR_TONES[hash % MEMBER_AVATAR_TONES.length];
};

/** 이모지나 조합 문자로 시작해도 한 글자로 자른다. */
export const getMemberInitial = (name: string) => Array.from(name.trim())[0] ?? "?";
