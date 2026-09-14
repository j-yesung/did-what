import type { RecordFieldErrors, RecordWeather } from "@/entities/record";
import type { RecordLocationPlace, RecordLocationRegion } from "@/features/record/select-record-location";
import { isIsoDate } from "@/shared/lib/validation/is-iso-date";

export const RECORD_CREATE_STEPS = ["when", "where", "what"] as const;

export type RecordCreateStep = (typeof RECORD_CREATE_STEPS)[number];

export type RecordCreateContext = {
  activity: string;
  dirty: boolean;
  memo: string;
  places: RecordLocationPlace[];
  recordedAt: string;
  recordedUntil: string;
  region: RecordLocationRegion | null;
  weather: RecordWeather;
};

export type RecordCreateStepMap = Record<RecordCreateStep, RecordCreateContext>;

export const getRecordCreateStepIndex = (step: RecordCreateStep) => {
  return RECORD_CREATE_STEPS.indexOf(step);
};

export const validateRecordCreateStep = (step: RecordCreateStep, context: RecordCreateContext): RecordFieldErrors => {
  const fieldErrors: RecordFieldErrors = {};

  if (step === "when") {
    if (!isIsoDate(context.recordedAt)) fieldErrors.recordedAt = "올바른 날짜를 입력해 주세요.";
    if (context.recordedUntil && (!isIsoDate(context.recordedUntil) || context.recordedUntil < context.recordedAt)) {
      fieldErrors.recordedUntil = "종료일은 시작일과 같거나 이후여야 해요.";
    }
  }

  if (step === "where") {
    if (!context.region) fieldErrors.regionCode = "목록에서 지역을 선택해 주세요.";
    if (context.places.length > 10) fieldErrors.places = "방문 장소는 10곳까지 선택할 수 있어요.";
  }

  if (step === "what") {
    const activity = context.activity.trim();
    if (activity.length < 1 || activity.length > 120) {
      fieldErrors.activity = "한 일은 1자 이상 120자 이하로 입력해 주세요.";
    }
    if (context.memo.trim().length > 500) fieldErrors.memo = "메모는 500자 이하로 입력해 주세요.";
  }

  return fieldErrors;
};

export const getRecordCreateErrorStep = (fieldErrors: RecordFieldErrors): RecordCreateStep | null => {
  if (fieldErrors.recordedAt || fieldErrors.recordedUntil || fieldErrors.weather) return "when";
  if (fieldErrors.regionCode || fieldErrors.places) return "where";
  if (fieldErrors.activity || fieldErrors.memo) return "what";
  return null;
};

export const toRecordCreateFormData = (context: RecordCreateContext) => {
  const formData = new FormData();

  formData.set("activity", context.activity);
  formData.set("memo", context.memo);
  formData.set("places", JSON.stringify(context.places.map((place) => place.reference)));
  formData.set("recordedAt", context.recordedAt);
  formData.set("recordedUntil", context.recordedUntil);
  formData.set("regionCode", context.region?.code ?? "");
  formData.set("regionLabel", context.region?.label ?? "");
  formData.set("regionName", context.region?.fullName ?? "");
  formData.set("weather", context.weather);

  return formData;
};
