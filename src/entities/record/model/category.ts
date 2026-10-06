export const RECORD_CATEGORY_OPTIONS = [
  { label: "일상", value: "daily" },
  { label: "데이트", value: "date" },
  { label: "여행", value: "travel" },
  { label: "기념일", value: "anniversary" },
  { label: "모임", value: "gathering" },
  { label: "미분류", value: "uncategorized" },
] as const;

export type RecordCategory = (typeof RECORD_CATEGORY_OPTIONS)[number]["value"];

export const DEFAULT_RECORD_CATEGORY: RecordCategory = "uncategorized";

export const isRecordCategory = (value: unknown): value is RecordCategory => {
  return RECORD_CATEGORY_OPTIONS.some((option) => option.value === value);
};

export const normalizeRecordCategory = (value: unknown): RecordCategory => {
  return isRecordCategory(value) ? value : DEFAULT_RECORD_CATEGORY;
};

export const getRecordCategoryLabel = (category: RecordCategory) => {
  return RECORD_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? "미분류";
};

/** Tailwind는 소스에 적힌 클래스만 찾으므로 조합하지 않고 그대로 적는다. */
export const RECORD_CATEGORY_DOT: Record<RecordCategory, string> = {
  anniversary: "bg-category-anniversary",
  daily: "bg-category-daily",
  date: "bg-category-date",
  gathering: "bg-category-gathering",
  travel: "bg-category-travel",
  uncategorized: "bg-category-uncategorized",
};

export const RECORD_CATEGORY_FILL: Record<RecordCategory, string> = {
  anniversary: "bg-category-anniversary-subtle",
  daily: "bg-category-daily-subtle",
  date: "bg-category-date-subtle",
  gathering: "bg-category-gathering-subtle",
  travel: "bg-category-travel-subtle",
  uncategorized: "bg-category-uncategorized-subtle",
};

export const RECORD_CATEGORY_BADGE: Record<RecordCategory, string> = {
  anniversary: "bg-category-anniversary/8 text-category-anniversary",
  daily: "bg-category-daily/8 text-category-daily",
  date: "bg-category-date/8 text-category-date",
  gathering: "bg-category-gathering/8 text-category-gathering",
  travel: "bg-primary/15 text-primary",
  uncategorized: "bg-muted text-muted-foreground",
};
