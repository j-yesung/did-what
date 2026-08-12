// 같은 폴더의 테스트를 plain node로 실행하므로 @/ alias 대신 상대 경로를 쓴다.
import { isUuid } from "../../../shared/lib/is-uuid.ts";

export type RecordFieldErrors = Partial<Record<"recordedAt" | "personIds" | "placeId" | "activity" | "memo", string>>;

export type RecordInput = {
  recordedAt: string;
  personIds: string[];
  placeId: string;
  activity: string;
  memo?: string;
};

export type RecordInputValues = {
  recordedAt: string;
  personIds: readonly string[];
  placeId: string;
  activity: string;
  memo: string;
};

export type CreateRecordActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: RecordFieldErrors;
};

export type PersonOption = {
  id: string;
  name: string;
};

export type PlaceOption = {
  id: string;
  name: string;
  address: string | null;
};

export const INITIAL_CREATE_RECORD_STATE: CreateRecordActionState = { status: "idle" };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function validateRecordInput(
  values: RecordInputValues,
): { data: RecordInput; fieldErrors?: never } | { data?: never; fieldErrors: RecordFieldErrors } {
  const fieldErrors: RecordFieldErrors = {};
  const personIds = [...new Set(values.personIds)];
  const activity = values.activity.trim();
  const memo = values.memo.trim();

  if (!isValidDate(values.recordedAt)) {
    fieldErrors.recordedAt = "올바른 날짜를 입력해 주세요.";
  }

  if (personIds.length === 0 || personIds.some((personId) => !isUuid(personId))) {
    fieldErrors.personIds = "함께한 사람을 한 명 이상 선택해 주세요.";
  }

  if (!isUuid(values.placeId)) {
    fieldErrors.placeId = "장소를 선택해 주세요.";
  }

  if (activity.length < 1 || activity.length > 120) {
    fieldErrors.activity = "한 일은 1자 이상 120자 이하로 입력해 주세요.";
  }

  if (memo.length > 500) {
    fieldErrors.memo = "메모는 500자 이하로 입력해 주세요.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    data: {
      recordedAt: values.recordedAt,
      personIds,
      placeId: values.placeId,
      activity,
      ...(memo ? { memo } : {}),
    },
  };
}
