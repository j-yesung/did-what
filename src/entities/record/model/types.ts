import type { RecordFieldErrors } from "./record-form";

export type RecordSummary = {
  activity: string;
  id: string;
  memo: string | null;
  recorded_at: string;
  recorded_until: string | null;
  region_label?: string;
  region_name?: string;
  weather: string;
};

export type RecordFormState = {
  fieldErrors?: RecordFieldErrors;
  message?: string;
  status: "error" | "success";
};
