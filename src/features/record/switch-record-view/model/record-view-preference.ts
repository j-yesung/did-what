export type RecordView = "calendar" | "list";

const RECORD_VIEW_STORAGE_KEY = "did-what:records-view:v1";

export const parseRecordView = (value: string | null): RecordView | null => {
  return value === "calendar" || value === "list" ? value : null;
};

export const readRecordView = () => {
  try {
    return parseRecordView(window.localStorage.getItem(RECORD_VIEW_STORAGE_KEY));
  } catch {
    return null;
  }
};

export const saveRecordView = (view: RecordView) => {
  try {
    window.localStorage.setItem(RECORD_VIEW_STORAGE_KEY, view);
  } catch {
    // private mode 등 저장소를 쓸 수 없는 환경에서는 현재 보기만 쓴다.
  }
};
