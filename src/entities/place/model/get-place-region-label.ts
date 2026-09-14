const METROPOLITAN_NAMES = new Map([
  ["부산광역시", "부산"],
  ["대구광역시", "대구"],
  ["인천광역시", "인천"],
  ["광주광역시", "광주"],
  ["대전광역시", "대전"],
  ["울산광역시", "울산"],
  ["세종특별자치시", "세종"],
]);

export const getPlaceRegionLabel = (regionName: string | null, address: string | null): string => {
  const [province = "", district = ""] = (regionName ?? address ?? "").trim().split(/\s+/);

  if (!province) return "지역 정보 없음";
  if (province === "서울" || province === "서울특별시") return district || "서울";

  const metropolitanName = METROPOLITAN_NAMES.get(province) ?? METROPOLITAN_NAMES.get(`${province}광역시`);
  if (metropolitanName) return metropolitanName;

  return (district || province).replace(/(?:시|군)$/, "");
};
