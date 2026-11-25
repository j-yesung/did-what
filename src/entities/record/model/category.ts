export const RECORD_CATEGORY_OPTIONS = [
  { label: "일상", value: "daily" },
  { label: "데이트", value: "date" },
  { label: "여행", value: "travel" },
  { label: "축하", value: "celebration" },
  { label: "모임", value: "gathering" },
  { label: "미분류", value: "uncategorized" },
] as const;

export type RecordCategory = (typeof RECORD_CATEGORY_OPTIONS)[number]["value"];

export const DEFAULT_RECORD_CATEGORY: RecordCategory = "uncategorized";

export const isRecordCategory = (value: unknown): value is RecordCategory => {
  return RECORD_CATEGORY_OPTIONS.some((option) => option.value === value);
};

export const isRecordCategories = (value: unknown): value is RecordCategory[] => {
  return Array.isArray(value) && value.length <= 1 && value.every(isRecordCategory);
};

export const normalizeRecordCategories = (value: unknown): RecordCategory[] => {
  const values = Array.isArray(value) ? value : [value];
  return [
    ...new Set(
      values
        .map((category) => (category === "anniversary" ? "celebration" : category))
        .filter(
          (category): category is RecordCategory => isRecordCategory(category) && category !== DEFAULT_RECORD_CATEGORY,
        ),
    ),
  ];
};

export const normalizeRecordCategory = (value: unknown): RecordCategory => {
  return normalizeRecordCategories(value)[0] ?? DEFAULT_RECORD_CATEGORY;
};

export const getRecordCategoryLabel = (category: RecordCategory) => {
  return RECORD_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? "미분류";
};

export const RECORD_CATEGORY_DOT: Record<RecordCategory, string> = {
  celebration: "bg-category-anniversary",
  daily: "bg-category-daily",
  date: "bg-category-date",
  gathering: "bg-category-gathering",
  travel: "bg-category-travel",
  uncategorized: "bg-category-uncategorized",
};

export const RECORD_CATEGORY_FILL: Record<RecordCategory, string> = {
  celebration: "bg-category-anniversary-subtle",
  daily: "bg-category-daily-subtle",
  date: "bg-category-date-subtle",
  gathering: "bg-category-gathering-subtle",
  travel: "bg-category-travel-subtle",
  uncategorized: "bg-category-uncategorized-subtle",
};

export const RECORD_CATEGORY_BADGE: Record<RecordCategory, string> = {
  celebration: "bg-category-anniversary/8 text-category-anniversary",
  daily: "bg-category-daily/8 text-category-daily",
  date: "bg-category-date/8 text-category-date",
  gathering: "bg-category-gathering/8 text-category-gathering",
  travel: "bg-category-travel/8 text-category-travel",
  uncategorized: "bg-category-uncategorized/12 text-muted-foreground",
};
