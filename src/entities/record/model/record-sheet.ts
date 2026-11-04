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

const RECORD_SHEET_HISTORY_KEY = "didWhatRecordSheet";

type SheetHistory = Pick<History, "state" | "pushState" | "replaceState" | "back">;

export const openRecordSheet = (history: SheetHistory, href: string) => {
  const recordId = new URL(href, "http://app.invalid").searchParams.get("recordDetail");
  history.pushState({ [RECORD_SHEET_HISTORY_KEY]: recordId }, "", href);
};

/** 앱에서 추가한 항목만 되돌린다. 외부 링크·새 탭에서는 목록 주소에 머문다. */
export const closeRecordSheet = (history: SheetHistory, recordId: string, fallbackHref: string) => {
  if (history.state?.[RECORD_SHEET_HISTORY_KEY] === recordId) history.back();
  else history.replaceState(null, "", fallbackHref);
};
