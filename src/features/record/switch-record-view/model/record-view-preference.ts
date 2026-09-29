export type RecordView = "calendar" | "list";

// 서버가 /records를 그릴 때 읽어야 해서 쿠키에 둔다. 브라우저 저장소는 첫 화면을 그린 뒤에야 읽을 수 있다.
export const RECORD_VIEW_COOKIE = "did-what-records-view";

const ONE_YEAR = 60 * 60 * 24 * 365;

export const parseRecordView = (value: string | null | undefined): RecordView | null => {
  return value === "calendar" || value === "list" ? value : null;
};

export const saveRecordView = (view: RecordView) => {
  // 서버 액션 왕복 없이 누르는 즉시 저장한다. 이 쿠키는 보기 선택만 담는다.
  document.cookie = `${RECORD_VIEW_COOKIE}=${view}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
};
