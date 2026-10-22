// 일반구가 있는 도시는 상위 시 대신 일반구를 세고, 시·군·구가 없는 세종은 법정 읍·면·동을 센다.
export const REGIONS = [
  { administrativeCodes: ["11"], code: "KR-11", label: "서울", name: "서울특별시", subdivisionCount: 25 },
  { administrativeCodes: ["26"], code: "KR-26", label: "부산", name: "부산광역시", subdivisionCount: 16 },
  { administrativeCodes: ["27"], code: "KR-27", label: "대구", name: "대구광역시", subdivisionCount: 9 },
  { administrativeCodes: ["28"], code: "KR-28", label: "인천", name: "인천광역시", subdivisionCount: 11 },
  // 통합 후 코드(12)와 통합 전 광주·전남 코드(29·46)를 함께 인식해 기존 기록도 이어서 집계한다.
  {
    administrativeCodes: ["12", "29", "46"],
    code: "KR-12",
    label: "전남광주",
    name: "전남광주통합특별시",
    subdivisionCount: 27,
  },
  { administrativeCodes: ["30"], code: "KR-30", label: "대전", name: "대전광역시", subdivisionCount: 5 },
  { administrativeCodes: ["31"], code: "KR-31", label: "울산", name: "울산광역시", subdivisionCount: 5 },
  { administrativeCodes: ["36"], code: "KR-50", label: "세종", name: "세종특별자치시", subdivisionCount: 33 },
  { administrativeCodes: ["41"], code: "KR-41", label: "경기", name: "경기도", subdivisionCount: 47 },
  { administrativeCodes: ["42", "51"], code: "KR-42", label: "강원", name: "강원특별자치도", subdivisionCount: 18 },
  { administrativeCodes: ["43"], code: "KR-43", label: "충북", name: "충청북도", subdivisionCount: 14 },
  { administrativeCodes: ["44"], code: "KR-44", label: "충남", name: "충청남도", subdivisionCount: 16 },
  { administrativeCodes: ["45", "52"], code: "KR-45", label: "전북", name: "전북특별자치도", subdivisionCount: 15 },
  { administrativeCodes: ["47"], code: "KR-47", label: "경북", name: "경상북도", subdivisionCount: 23 },
  { administrativeCodes: ["48"], code: "KR-48", label: "경남", name: "경상남도", subdivisionCount: 22 },
  { administrativeCodes: ["49"], code: "KR-49", label: "제주", name: "제주특별자치도", subdivisionCount: 2 },
] as const;

export type Region = (typeof REGIONS)[number];
export type RegionCode = Region["code"];

const REGION_CODE_ALIASES = new Map<string, RegionCode>([
  ["KR-29", "KR-12"],
  ["KR-46", "KR-12"],
]);

export const getRegion = (regionCode: string) => {
  const canonicalCode = REGION_CODE_ALIASES.get(regionCode) ?? regionCode;
  return REGIONS.find(({ code }) => code === canonicalCode);
};

export const getRegionCode = (administrativeCode: string): RegionCode | null => {
  const prefix = administrativeCode.slice(0, 2);
  return REGIONS.find((region) => (region.administrativeCodes as readonly string[]).includes(prefix))?.code ?? null;
};

export const filterRecordsByRegion = <T extends { region_code: string }>(
  records: readonly T[],
  regionCode: RegionCode,
) => {
  return records.filter((record) => getRegionCode(record.region_code) === regionCode);
};
