/** proxy가 요청 주소를 실어 보내는 헤더. 레이아웃은 현재 주소를 모르므로 로그인·구성원 선택으로 보낼 때 이걸 읽는다. */
export const RETURN_TO_HEADER = "x-return-to";

/** 로그인·구성원 선택 뒤 돌아갈 주소. 다른 사이트로 나가지 않도록 앱 내부 경로만 받고, 아니면 홈으로 보낸다. */
export const toSafeReturnTo = (value: unknown) => {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
};

/** 돌아갈 주소를 returnTo 쿼리로 붙인다. 홈으로 돌아가면 되는 경우에는 붙이지 않는다. */
export const withReturnTo = (path: string, returnTo: unknown) => {
  const safe = toSafeReturnTo(returnTo);
  return safe === "/" ? path : `${path}?returnTo=${encodeURIComponent(safe)}`;
};
