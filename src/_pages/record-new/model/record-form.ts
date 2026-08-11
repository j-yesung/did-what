export type Person = {
  id: string;
  name: string;
};

export type Place = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  region?: string;
  district?: string;
};

export type RecordInput = {
  recordedAt: string;
  personIds: string[];
  placeId: string;
  activity: string;
  memo?: string;
};

type RecordInputValues = Omit<RecordInput, "memo" | "personIds"> & {
  personIds: readonly string[];
  memo: string;
};

export const MOCK_PEOPLE: readonly Person[] = [
  { id: "person-da-yeon", name: "다연" },
  { id: "person-min-jun", name: "민준" },
  { id: "person-seo-yun", name: "서윤" },
  { id: "person-ji-ho", name: "지호" },
];

export const MOCK_PLACES: readonly Place[] = [
  {
    id: "place-seongsu-cafe-street",
    name: "성수 카페거리",
    address: "서울 성동구 성수동2가",
    latitude: 37.5445,
    longitude: 127.056,
    region: "서울특별시",
    district: "성동구",
  },
  {
    id: "place-hangang-yeouido-park",
    name: "여의도 한강공원",
    address: "서울 영등포구 여의동로 330",
    latitude: 37.5284,
    longitude: 126.9348,
    region: "서울특별시",
    district: "영등포구",
  },
  {
    id: "place-gwangalli-beach",
    name: "광안리해수욕장",
    address: "부산 수영구 광안해변로 219",
    latitude: 35.1532,
    longitude: 129.1187,
    region: "부산광역시",
    district: "수영구",
  },
  {
    id: "place-aewol-coast-road",
    name: "애월 해안도로",
    address: "제주 제주시 애월읍 애월해안로",
    latitude: 33.4628,
    longitude: 126.3093,
    region: "제주특별자치도",
    district: "제주시",
  },
];

export function createRecordInput(values: RecordInputValues): RecordInput {
  const memo = values.memo.trim();

  return {
    recordedAt: values.recordedAt,
    personIds: [...values.personIds],
    placeId: values.placeId,
    activity: values.activity.trim(),
    ...(memo ? { memo } : {}),
  };
}
