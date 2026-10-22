import { isIsoDate } from "@/shared/lib/validation/is-iso-date";

import type { RecordFieldErrors } from "./record-form";

export const validateRecordDates = ({
  recordedAt,
  recordedUntil,
}: {
  recordedAt: string;
  recordedUntil: string;
}): RecordFieldErrors => {
  const fieldErrors: RecordFieldErrors = {};
  if (!isIsoDate(recordedAt)) fieldErrors.recordedAt = "올바른 날짜를 입력해 주세요.";
  if (recordedUntil && (!isIsoDate(recordedUntil) || recordedUntil < recordedAt)) {
    fieldErrors.recordedUntil = "종료일은 시작일과 같거나 이후여야 해요.";
  }
  return fieldErrors;
};

export const validateRecordContent = ({ activity, memo }: { activity: string; memo: string }): RecordFieldErrors => {
  const fieldErrors: RecordFieldErrors = {};
  const title = activity.trim();
  if (title.length < 1 || title.length > 120) {
    fieldErrors.activity = "기록 제목은 1자 이상 120자 이하로 입력해 주세요.";
  }
  if (memo.trim().length > 500) fieldErrors.memo = "메모는 500자 이하로 입력해 주세요.";
  return fieldErrors;
};
