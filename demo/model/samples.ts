import type { KakaoPlace, KakaoRegion } from "@/shared/api/kakao-local/types";

/**
 * 카카오 지역·장소 검색을 대신하는 샘플. 실제 API를 부르지 않고 이 목록 안에서만 찾는다.
 * 코드는 앞 두 자리(시·도)와 다섯 자리(시·군·구)만 지도와 장소 분류에 쓰인다.
 */
export const DEMO_REGIONS = [
  { code: "1144012000", fullName: "서울 마포구 망원동", latitude: 37.5556, longitude: 126.9019, name: "망원동" },
  { code: "1120011500", fullName: "서울 성동구 성수동2가", latitude: 37.5446, longitude: 127.0557, name: "성수동2가" },
  { code: "1111014000", fullName: "서울 종로구 삼청동", latitude: 37.5847, longitude: 126.9821, name: "삼청동" },
  { code: "1168010100", fullName: "서울 강남구 역삼동", latitude: 37.5007, longitude: 127.0365, name: "역삼동" },
  { code: "2635010500", fullName: "부산 해운대구 우동", latitude: 35.1631, longitude: 129.1636, name: "우동" },
  { code: "2650010200", fullName: "부산 수영구 광안동", latitude: 35.1532, longitude: 129.1186, name: "광안동" },
  { code: "2611010000", fullName: "부산 중구 남포동", latitude: 35.0979, longitude: 129.03, name: "남포동" },
  { code: "4911025000", fullName: "제주 제주시 애월읍", latitude: 33.4628, longitude: 126.3297, name: "애월읍" },
  { code: "4913011000", fullName: "제주 서귀포시 중문동", latitude: 33.2541, longitude: 126.412, name: "중문동" },
  { code: "5115010600", fullName: "강원 강릉시 견소동", latitude: 37.772, longitude: 128.947, name: "견소동" },
  { code: "4111514000", fullName: "경기 수원시 팔달구 행궁동", latitude: 37.2828, longitude: 127.0145, name: "행궁동" },
  { code: "4613010100", fullName: "전남 여수시 중앙동", latitude: 34.7398, longitude: 127.7356, name: "중앙동" },
  { code: "4713011500", fullName: "경북 경주시 황남동", latitude: 35.8375, longitude: 129.2105, name: "황남동" },
  { code: "3014010100", fullName: "대전 중구 은행동", latitude: 36.3285, longitude: 127.4271, name: "은행동" },
  { code: "4311112000", fullName: "충북 청주시 상당구 북문로", latitude: 36.637, longitude: 127.489, name: "북문로" },
] as const satisfies readonly KakaoRegion[];

export type DemoKakaoPlace = KakaoPlace & { regionCode: string };

const kakaoPlace = (
  id: string,
  name: string,
  categoryGroupCode: string | null,
  categoryName: string,
  address: string,
  latitude: number,
  longitude: number,
  regionCode: (typeof DEMO_REGIONS)[number]["code"],
): DemoKakaoPlace => ({
  address,
  categoryGroupCode,
  categoryName,
  id,
  latitude,
  longitude,
  name,
  parcelAddress: null,
  regionCode,
});

export const DEMO_KAKAO_PLACES: readonly DemoKakaoPlace[] = [
  kakaoPlace(
    "9100001",
    "망원 한강공원",
    "AT4",
    "여행 > 공원",
    "서울 마포구 마포나루길 467",
    37.5553,
    126.896,
    "1144012000",
  ),
  kakaoPlace(
    "9100002",
    "성수 브루잉 카페",
    "CE7",
    "음식점 > 카페",
    "서울 성동구 연무장길 12",
    37.543,
    127.056,
    "1120011500",
  ),
  kakaoPlace(
    "9100003",
    "삼청동 수제비",
    "FD6",
    "음식점 > 한식",
    "서울 종로구 삼청로 101",
    37.585,
    126.9817,
    "1111014000",
  ),
  kakaoPlace(
    "9100004",
    "해운대 해수욕장",
    "AT4",
    "여행 > 관광,명소",
    "부산 해운대구 해운대해변로 264",
    35.1587,
    129.1604,
    "2635010500",
  ),
  kakaoPlace(
    "9100005",
    "광안리 해변 카페",
    "CE7",
    "음식점 > 카페",
    "부산 수영구 광안해변로 219",
    35.153,
    129.119,
    "2650010200",
  ),
  kakaoPlace(
    "9100006",
    "애월 해안 산책로",
    "AT4",
    "여행 > 관광,명소",
    "제주 제주시 애월읍 애월해안로 272",
    33.4626,
    126.3101,
    "4911025000",
  ),
  kakaoPlace(
    "9100007",
    "중문 색달 해변",
    "AT4",
    "여행 > 관광,명소",
    "제주 서귀포시 색달동 2950",
    33.2445,
    126.4118,
    "4913011000",
  ),
  kakaoPlace(
    "9100008",
    "안목 커피거리",
    "CE7",
    "음식점 > 카페",
    "강원 강릉시 창해로14번길 20",
    37.7717,
    128.9471,
    "5115010600",
  ),
  kakaoPlace(
    "9100009",
    "수원 화성 행궁",
    "CT1",
    "문화,예술 > 고궁",
    "경기 수원시 팔달구 정조로 825",
    37.2818,
    127.0136,
    "4111514000",
  ),
  kakaoPlace(
    "9100010",
    "여수 낭만포차 거리",
    "FD6",
    "음식점 > 술집",
    "전남 여수시 하멜로 102",
    34.7385,
    127.738,
    "4613010100",
  ),
  kakaoPlace(
    "9100011",
    "황리단길 한옥 카페",
    "CE7",
    "음식점 > 카페",
    "경북 경주시 포석로 1080",
    35.838,
    129.21,
    "4713011500",
  ),
  kakaoPlace(
    "9100012",
    "은행동 빵집",
    "FD6",
    "음식점 > 베이커리",
    "대전 중구 대종로480번길 15",
    36.3277,
    127.4273,
    "3014010100",
  ),
  kakaoPlace("9100013", "남포동 시장", null, "쇼핑 > 시장", "부산 중구 신창동4가 36", 35.1018, 129.028, "2611010000"),
  kakaoPlace(
    "9100014",
    "망원시장 칼국수",
    "FD6",
    "음식점 > 한식",
    "서울 마포구 포은로8길 14",
    37.556,
    126.906,
    "1144012000",
  ),
];

export const getDemoRegion = (code: string): KakaoRegion | undefined => {
  return DEMO_REGIONS.find((region) => region.code === code);
};

export const getDemoKakaoPlace = (id: string) => DEMO_KAKAO_PLACES.find((place) => place.id === id);

/** "성수 카페"처럼 띄어 쓴 검색어는 모든 낱말이 들어간 곳만 찾는다. */
const matches = (text: string, query: string) => {
  const target = text.toLocaleLowerCase("ko-KR");
  return query
    .toLocaleLowerCase("ko-KR")
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => target.includes(word));
};

export const searchDemoRegions = (query: string) => {
  return DEMO_REGIONS.filter((region) => matches(region.fullName, query));
};

export const searchDemoKakaoPlaces = (query: string, scope?: { latitude: number; longitude: number } | null) => {
  const found = DEMO_KAKAO_PLACES.filter((place) =>
    matches(`${place.name} ${place.address} ${place.categoryName}`, query),
  );
  if (!scope) return found;

  // 실제 검색처럼 기준 지역에서 가까운 곳을 먼저 보여준다.
  const distance = (place: DemoKakaoPlace) =>
    (place.latitude - scope.latitude) ** 2 + (place.longitude - scope.longitude) ** 2;
  return found.toSorted((a, b) => distance(a) - distance(b));
};
