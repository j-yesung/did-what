import type { RecordCategory, RecordFieldErrors, RecordWeather } from "@/entities/record";
import { MAX_VISITED_PLACES, MAX_VISITED_REGIONS } from "@/entities/record/model/limits";
import { validateRecordContent, validateRecordDates } from "@/entities/record/model/record-validation";
import type { RecordLocationPlace, RecordLocationRegion } from "@/features/record/select-record-location";
import { toVisitedRegions } from "@/features/record/select-record-location/model/location-picker";

export const RECORD_CREATE_STEPS = ["when", "where", "what"] as const;

export type RecordCreateStep = (typeof RECORD_CREATE_STEPS)[number];

export type RecordCreateContext = {
  activity: string;
  category: RecordCategory;
  dirty: boolean;
  memo: string;
  places: RecordLocationPlace[];
  recordedAt: string;
  recordedUntil: string;
  regions: RecordLocationRegion[];
  weather: RecordWeather;
};

export type RecordCreateStepMap = Record<RecordCreateStep, RecordCreateContext>;

export const getRecordCreateStepIndex = (step: RecordCreateStep) => {
  return RECORD_CREATE_STEPS.indexOf(step);
};

export const validateRecordCreateStep = (step: RecordCreateStep, context: RecordCreateContext): RecordFieldErrors => {
  const fieldErrors: RecordFieldErrors = {};

  if (step === "when") {
    Object.assign(fieldErrors, validateRecordDates(context));
  }

  if (step === "where") {
    const visitedRegions = toVisitedRegions(context.regions, context.places);
    if (visitedRegions.length === 0) fieldErrors.regions = "방문 지역을 1곳 이상 선택해 주세요.";
    if (visitedRegions.length > MAX_VISITED_REGIONS) {
      fieldErrors.regions = `방문 지역은 ${MAX_VISITED_REGIONS}곳까지 선택할 수 있어요.`;
    }
    if (context.places.length > MAX_VISITED_PLACES) {
      fieldErrors.places = `방문 장소는 ${MAX_VISITED_PLACES}곳까지 선택할 수 있어요.`;
    }
  }

  if (step === "what") {
    Object.assign(fieldErrors, validateRecordContent(context));
  }

  return fieldErrors;
};

export const getRecordCreateErrorStep = (fieldErrors: RecordFieldErrors): RecordCreateStep | null => {
  if (fieldErrors.recordedAt || fieldErrors.recordedUntil || fieldErrors.weather) return "when";
  if (fieldErrors.regions || fieldErrors.places) return "where";
  if (fieldErrors.activity || fieldErrors.memo || fieldErrors.category) return "what";
  return null;
};

export const toRecordCreateFormData = (context: RecordCreateContext) => {
  const formData = new FormData();

  formData.set("activity", context.activity);
  formData.set("category", context.category);
  formData.set("memo", context.memo);
  formData.set("places", JSON.stringify(context.places.map((place) => place.reference)));
  formData.set("recordedAt", context.recordedAt);
  formData.set("recordedUntil", context.recordedUntil);
  formData.set(
    "regions",
    JSON.stringify(context.regions.map(({ code, fullName, label }) => ({ code, label, name: fullName }))),
  );
  formData.set("weather", context.weather);

  return formData;
};
