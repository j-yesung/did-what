export const RECORD_WEATHER_OPTIONS = [
  { label: "맑음", value: "sunny" },
  { label: "구름", value: "partly_cloudy" },
  { label: "흐림", value: "cloudy" },
  { label: "비", value: "rainy" },
  { label: "눈", value: "snowy" },
] as const;

export type RecordWeather = (typeof RECORD_WEATHER_OPTIONS)[number]["value"];

export const DEFAULT_RECORD_WEATHER: RecordWeather = "sunny";

export const isRecordWeather = (value: unknown): value is RecordWeather => {
  return RECORD_WEATHER_OPTIONS.some((option) => option.value === value);
};

export const normalizeRecordWeather = (value: unknown): RecordWeather => {
  return isRecordWeather(value) ? value : DEFAULT_RECORD_WEATHER;
};

export const getRecordWeatherLabel = (weather: RecordWeather) => {
  return RECORD_WEATHER_OPTIONS.find((option) => option.value === weather)?.label ?? "맑음";
};
