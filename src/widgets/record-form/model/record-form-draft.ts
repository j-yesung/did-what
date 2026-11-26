import type { RecordCategory, RecordFieldErrors, RecordWeather } from "@/entities/record";
import { DEFAULT_RECORD_WEATHER } from "@/entities/record/model/options/weather";
import type {
  RecordLocationPlace,
  RecordLocationRegion,
} from "@/features/record/select-record-location/model/location-picker";

export type RecordFormDraft = {
  activity: string;
  category: RecordCategory[];
  memo: string;
  places: RecordLocationPlace[];
  recordedAt: string;
  recordedUntil: string | null;
  regions: RecordLocationRegion[];
  weather: RecordWeather;
};

export type RecordFormSlot = "date" | "weather" | "where" | "category" | "activity";

export const createRecordFormDraft = (recordedAt: string, place?: RecordLocationPlace): RecordFormDraft => ({
  activity: "",
  category: [],
  memo: "",
  places: place ? [place] : [],
  recordedAt,
  recordedUntil: recordedAt,
  regions: [],
  weather: DEFAULT_RECORD_WEATHER,
});

export const toRecordFormData = (draft: RecordFormDraft) => {
  const formData = new FormData();

  formData.set("activity", draft.activity);
  formData.set("category", JSON.stringify(draft.category));
  formData.set("memo", draft.memo);
  formData.set("places", JSON.stringify(draft.places.map((place) => place.reference)));
  formData.set("recordedAt", draft.recordedAt);
  formData.set("recordedUntil", draft.recordedUntil ?? "");
  formData.set(
    "regions",
    JSON.stringify(draft.regions.map(({ code, fullName, label }) => ({ code, label, name: fullName }))),
  );
  formData.set("weather", draft.weather);

  return formData;
};

export const hasRecordLocation = (draft: RecordFormDraft) => draft.regions.length > 0 || draft.places.length > 0;

export const isRecordDraftReady = (draft: RecordFormDraft) =>
  hasRecordLocation(draft) && draft.activity.trim().length > 0;

const SLOT_FIELDS: [RecordFormSlot, (keyof RecordFieldErrors)[]][] = [
  ["date", ["recordedAt", "recordedUntil"]],
  ["weather", ["weather"]],
  ["where", ["regions", "places"]],
  ["category", ["category"]],
  ["activity", ["activity"]],
];

export const getErrorSlots = (errors: RecordFieldErrors) =>
  SLOT_FIELDS.filter(([, fields]) => fields.some((field) => errors[field])).map(([slot]) => slot);

export const getRecordFormHint = (draft: RecordFormDraft, errors: RecordFieldErrors) => {
  if (errors.regions && !hasRecordLocation(draft)) return "다녀온 곳을 골라주세요.";
  if (errors.activity && !draft.activity.trim()) return "뭐 했는지 적어주세요.";

  return [...SLOT_FIELDS.flatMap(([, fields]) => fields), "memo" as const].map((field) => errors[field]).find(Boolean);
};
