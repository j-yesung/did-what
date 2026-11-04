/** 기록 상세 링크를 현재 화면 위에서 여는 시트 주소로 바꾼다. */
export const toRecordSheetHref = (href: string, backgroundHref: string) => {
  const target = new URL(href, "http://app.invalid");
  if (target.origin !== "http://app.invalid") return null;
  const match = /^\/records\/(?!new$)([^/]+)$/.exec(target.pathname);
  if (!match) return null;

  const background = new URL(backgroundHref, "http://app.invalid");
  const canKeepBackground = /^(\/|\/records|\/places(?:\/[^/]+)?|\/notifications|\/settings)$/.test(
    background.pathname,
  );
  if (!canKeepBackground) {
    background.pathname = "/records";
    background.search = "";
  }
  background.searchParams.set("recordDetail", match[1]);
  background.searchParams.delete("recordFrom");
  if (target.searchParams.get("from") === "notification") background.searchParams.set("recordFrom", "notification");
  return `${background.pathname}?${background.searchParams}${target.hash}`;
};
