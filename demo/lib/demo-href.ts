/**
 * 체험 페이지 가운데 iframe이 여는 앱 주소. 앱 경로는 path 쿼리에 담는다.
 * 페이지가 하나라 화면을 옮겨도 서버를 다시 부르지 않고 브라우저 안에서만 바뀐다.
 *   /records?view=list → /demo/app?path=%2Frecords&view=list
 */
export const DEMO_APP_PATH = "/demo/app";
export const DEMO_PATH_PARAM = "path";

const isDemoPath = (href: string) => href === "/demo" || /^\/demo[/?#]/.test(href);

export const isDemoAppHref = (href: string) => href === DEMO_APP_PATH || /^\/demo\/app[?#]/.test(href);

const isAppPathname = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= 500 &&
  value.startsWith("/") &&
  !value.startsWith("//") &&
  !value.startsWith("/\\") &&
  !isDemoPath(value);

/**
 * 앱 컴포넌트가 쓰는 실제 경로(/records/1?from=notification)를 데모 주소로 바꾼다.
 * 이미 데모 주소이거나 앱 밖 주소면 그대로 둔다.
 */
export const toDemoHref = (href: string) => {
  if (!isAppPathname(href)) return href;

  const url = new URL(href, "http://demo.invalid");
  const params = new URLSearchParams();
  if (url.pathname !== "/") params.set(DEMO_PATH_PARAM, url.pathname);
  url.searchParams.forEach((value, key) => {
    params.append(key, value);
  });
  const search = params.toString();
  return `${DEMO_APP_PATH}${search ? `?${search}` : ""}${url.hash}`;
};

/** 데모 주소의 쿼리를 앱이 보는 경로와 쿼리로 나눈다. */
export const readAppLocation = (search: string) => {
  const searchParams = new URLSearchParams(search);
  const path = searchParams.get(DEMO_PATH_PARAM);
  searchParams.delete(DEMO_PATH_PARAM);
  return { pathname: isAppPathname(path) ? path : "/", searchParams };
};

export const toAppHref = (search: string) => {
  const { pathname, searchParams } = readAppLocation(search);
  const query = searchParams.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
};

/** 체험 페이지 주소나 메시지로 받은 앱 경로. 앱 내부 경로만 받고 아니면 지도로 보낸다. */
export const toSafeAppPath = (value: unknown) => (isAppPathname(value) ? value : "/");
