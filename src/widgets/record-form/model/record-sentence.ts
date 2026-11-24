import type { RecordWeather } from "@/entities/record/model/weather";
import type {
  RecordLocationPlace,
  RecordLocationRegion,
} from "@/features/record/select-record-location/model/location-picker";
import { isIsoDate } from "@/shared/lib/validation/is-iso-date";

export const RECORD_WEATHER_PHRASE: Record<RecordWeather, string> = {
  cloudy: "흐린 날",
  partly_cloudy: "구름 낀 날",
  rainy: "비 오는 날",
  snowy: "눈 오는 날",
  sunny: "맑은 날",
};

const toDateParts = (date: string) => ({
  day: Number(date.slice(8, 10)),
  month: Number(date.slice(5, 7)),
  year: Number(date.slice(0, 4)),
});

export const formatRecordDateSlot = (recordedAt: string, recordedUntil: string | null, today: string) => {
  if (!isIsoDate(recordedAt)) return null;

  const start = toDateParts(recordedAt);
  const startText = `${start.year === toDateParts(today).year ? "" : `${start.year}년 `}${start.month}월 ${start.day}일`;
  if (!recordedUntil || recordedUntil === recordedAt || !isIsoDate(recordedUntil)) return startText;

  const end = toDateParts(recordedUntil);
  if (end.year !== start.year) return `${startText}~${end.year}년 ${end.month}월 ${end.day}일`;
  if (end.month !== start.month) return `${startText}~${end.month}월 ${end.day}일`;
  return `${startText}~${end.day}일`;
};

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const RIEUL_FINAL = 8;

export const getDirectionParticle = (word: string) => {
  const code = word.charCodeAt(word.length - 1);
  if (code < HANGUL_START || code > HANGUL_END) return "로";

  const final = (code - HANGUL_START) % 28;
  return final === 0 || final === RIEUL_FINAL ? "로" : "으로";
};

export const getRecordLocationSummary = (
  regions: readonly RecordLocationRegion[],
  places: readonly RecordLocationPlace[],
) => {
  const placeRegionCodes = new Set(places.map((place) => place.region.code));
  const regionsWithoutPlace = regions.filter((region) => !placeRegionCodes.has(region.code));
  const name = places[0]?.name ?? regionsWithoutPlace[0]?.label;
  if (!name) return null;

  return { more: places.length + regionsWithoutPlace.length - 1, name };
};
