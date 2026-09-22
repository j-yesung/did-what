import type { RecordFieldErrors } from "./record-form";

export type RecordSummary = {
  activity: string;
  category: string;
  id: string;
  memo: string | null;
  recorded_at: string;
  recorded_until: string | null;
  // 상세 화면이 방문 장소를 받기 전에 그 자리를 잡아 두는 데 쓴다.
  record_places?: { count: number }[];
  record_comments?: { count: number }[];
  record_regions?: { region_label: string }[];
  region_label?: string;
  region_name?: string;
  weather: string;
};

export type RecordFormState = {
  fieldErrors?: RecordFieldErrors;
  message?: string;
  status: "error" | "success";
};
