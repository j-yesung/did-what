// 쿠키의 존재는 로딩 화면 선택에만 사용한다. 인증 판단은 이후 서버 검증에서 한다.
export const shouldShowAppShell = (method: string, pathname: string, headers: Headers, cookieNames: string[]) =>
  method === "GET" &&
  pathname === "/" &&
  headers.get("accept")?.includes("text/html") === true &&
  !headers.has("rsc") &&
  !headers.has("next-router-prefetch") &&
  !/prefetch/i.test(headers.get("purpose") ?? "") &&
  !/prefetch/i.test(headers.get("sec-purpose") ?? "") &&
  cookieNames.some((name) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name));
