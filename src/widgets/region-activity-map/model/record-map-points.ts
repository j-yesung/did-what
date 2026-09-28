import type { Region } from "@/entities/region";

export type RegionCode = Region["code"];

export type MapRecord = {
  activity: string;
  id: string;
  recorded_at: string;
  record_places: { place: { id: string; latitude: number; longitude: number; name: string } | null }[];
  record_regions: { region_code: string; region_latitude: number; region_longitude: number; region_name: string }[];
};

export type RecordMapPoint = {
  activity: string;
  id: string;
  kind: "place" | "region";
  label: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
  recordId: string;
};

export const toRecordMapPoints = (records: readonly MapRecord[]): RecordMapPoint[] =>
  records.flatMap<RecordMapPoint>((record) => {
    const places = record.record_places.flatMap(({ place }) => (place ? [place] : []));
    if (places.length > 0) {
      return places.map((place) => ({
        activity: record.activity,
        id: `place:${record.id}:${place.id}`,
        kind: "place" as const,
        label: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        recordedAt: record.recorded_at,
        recordId: record.id,
      }));
    }

    return record.record_regions.map((region) => ({
      activity: record.activity,
      id: `region:${record.id}:${region.region_code}`,
      kind: "region" as const,
      label: region.region_name,
      latitude: region.region_latitude,
      longitude: region.region_longitude,
      recordedAt: record.recorded_at,
      recordId: record.id,
    }));
  });

// region_name은 "서울 중구", "충북 청주시 상당구"처럼 시·도 약칭 뒤에 시·군·구가 붙는다.
// 시 아래 일반구는 같은 시로 묶어야 청주 여행 한 번이 시트에서 청주시 칩 하나로 모인다.
export const getSubregionName = (regionName: string) => regionName.split(" ")[1] ?? regionName;

// 배지 꼬리가 가리킬 지점. 배지는 보통 지점 위에 떠서, 기록이 몰리는 서울은 북쪽 끝에 두어 점을 덜 가린다.
// 경기는 서울 배지·점과 겹치지 않게 남동쪽(이천·안성 사이)에 둔다.
export const REGION_BADGE_ANCHORS: Record<RegionCode, { label: string; latitude: number; longitude: number }> = {
  "KR-11": { label: "서울", latitude: 37.65, longitude: 127 },
  "KR-26": { label: "부산", latitude: 35.17, longitude: 129.06 },
  "KR-27": { label: "대구", latitude: 35.86, longitude: 128.6 },
  "KR-28": { label: "인천", latitude: 37.46, longitude: 126.7 },
  "KR-12": { label: "전남광주", latitude: 35, longitude: 126.9 },
  "KR-30": { label: "대전", latitude: 36.35, longitude: 127.38 },
  "KR-31": { label: "울산", latitude: 35.54, longitude: 129.31 },
  "KR-50": { label: "세종", latitude: 36.56, longitude: 127.26 },
  "KR-41": { label: "경기", latitude: 37.12, longitude: 127.45 },
  "KR-42": { label: "강원", latitude: 37.75, longitude: 128.3 },
  "KR-43": { label: "충북", latitude: 36.8, longitude: 127.75 },
  "KR-44": { label: "충남", latitude: 36.55, longitude: 126.85 },
  "KR-45": { label: "전북", latitude: 35.75, longitude: 127.15 },
  "KR-47": { label: "경북", latitude: 36.35, longitude: 128.8 },
  "KR-48": { label: "경남", latitude: 35.3, longitude: 128.2 },
  "KR-49": { label: "제주", latitude: 33.38, longitude: 126.55 },
};

// 배지 크기는 화면 픽셀이다. 지도 단위로 그릴 때 unitsPerPixel을 곱해 확대해도 같은 크기로 보이게 한다.
export const BADGE_FONT_SIZE = 12;
const BADGE_HEIGHT = 24;
const BADGE_GAP = 7;
const BADGE_TAIL = 5;
const BADGE_MARGIN = 3;
// 전국이 한눈에 보이는 배율에서는 배지가 지도를 덮지 않게 기록 많은 곳만 보여준다.
export const OVERVIEW_BADGE_LIMIT = 5;

type BadgeCandidate = { code: RegionCode; count: number; label: string; x: number; y: number };

export type PlacedBadge = BadgeCandidate & { height: number; left: number; path: string; top: number; width: number };

// ponytail: 글자 폭은 한글 1em, 숫자 0.62em으로 어림한다. 실제 글꼴과 조금 달라도 좌우 여백만 달라진다.
const estimateBadgeWidth = (text: string) =>
  [...text].reduce((width, char) => width + (/[가-힣]/.test(char) ? 1 : 0.62) * BADGE_FONT_SIZE, 0) + 20;

// 배지는 언제나 지점 위에 떠서 꼬리가 아래를 가리킨다. 기록이 많은 지역부터 놓고, 먼저 놓인 배지와 겹치면 숨긴다.
// 확대할수록 배지 사이가 벌어져 숨었던 지역도 차례로 나타난다.
export const placeRegionBadges = (
  candidates: readonly BadgeCandidate[],
  unitsPerPixel: number,
  limit = Number.POSITIVE_INFINITY,
): PlacedBadge[] => {
  const scale = unitsPerPixel;
  const height = BADGE_HEIGHT * scale;
  const gap = BADGE_GAP * scale;
  const tail = BADGE_TAIL * scale;
  const margin = BADGE_MARGIN * scale;
  const placed: PlacedBadge[] = [];

  for (const candidate of [...candidates].sort((first, second) => second.count - first.count)) {
    if (placed.length >= limit) break;
    const { x, y } = candidate;
    const width = estimateBadgeWidth(`${candidate.label} ${candidate.count}`) * scale;
    const left = x - width / 2;
    const top = y - gap - height;
    const overlaps = placed.some(
      (badge) =>
        left < badge.left + badge.width + margin &&
        badge.left < left + width + margin &&
        top < badge.top + badge.height + margin &&
        badge.top < top + height + margin,
    );
    if (overlaps) continue;

    // 몸통(알약)과 아래 꼬리를 한 윤곽선으로 그린다. 꼬리를 따로 그리면 기기에 따라 확대했을 때 꼬리만 사라진다.
    const radius = height / 2;
    const bottom = top + height;
    const path = [
      `M${left + radius},${top}`,
      `H${left + width - radius}`,
      `A${radius},${radius} 0 0 1 ${left + width - radius},${bottom}`,
      `H${x + tail}`,
      `L${x},${bottom + tail}`,
      `L${x - tail},${bottom}`,
      `H${left + radius}`,
      `A${radius},${radius} 0 0 1 ${left + radius},${top}`,
      "Z",
    ].join("");
    placed.push({ ...candidate, height, left, path, top, width });
  }

  return placed;
};
