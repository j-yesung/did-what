import type { AccountMember } from "@/entities/member/model/types";
import type { RecordComment } from "@/entities/record-comment/model/record-comment";

import { DEMO_REGIONS, type DemoKakaoPlace, getDemoKakaoPlace } from "./samples.ts";
import type { DemoNotification, DemoPlace, DemoRecord, DemoRegion, DemoState } from "./types.ts";

export const DEMO_STATE_VERSION = 2;

/** 실제 앱이 uuid만 받으므로 같은 형식으로 고정 id를 만든다. 첫 글자로 종류를 구분한다. */
export const demoId = (kind: "a" | "b" | "c" | "d" | "e", index: number) =>
  `00000000-0000-4000-8000-${kind}${String(index).padStart(11, "0")}`;

export const DEMO_MEMBER_IDS = { jimin: demoId("a", 1), seojun: demoId("a", 2) } as const;
export const DEMO_RECORD_IDS = {
  hangang: demoId("b", 1),
  seongsu: demoId("b", 2),
  busan: demoId("b", 4),
} as const;

export const shiftDate = (date: string, days: number) => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

/** 같은 날 여러 기록도 순서가 갈리도록 기록마다 다른 시각을 준다. */
const timestampOf = (date: string, minute: number) =>
  `${date}T${String(9 + Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}:00.000Z`;

export const toDemoRegion = (code: string, selectedDirectly: boolean, label?: string): DemoRegion => {
  const region = DEMO_REGIONS.find((candidate) => candidate.code === code);
  if (!region) throw new Error(`Unknown demo region: ${code}`);

  return {
    region_code: region.code,
    region_label: label ?? region.name,
    region_latitude: region.latitude,
    region_longitude: region.longitude,
    region_name: region.fullName,
    selected_directly: selectedDirectly,
  };
};

export const toDemoPlace = (
  place: DemoKakaoPlace,
  id: string,
  createdAt: string,
  savedAt: string | null,
): DemoPlace => {
  const region = DEMO_REGIONS.find((candidate) => candidate.code === place.regionCode);

  return {
    address: place.address,
    category_group_code: place.categoryGroupCode,
    category_name: place.categoryName,
    created_at: createdAt,
    id,
    latitude: place.latitude,
    longitude: place.longitude,
    name: place.name,
    provider: "kakao",
    provider_place_id: place.id,
    region_code: place.regionCode,
    region_name: region?.fullName ?? null,
    saved_at: savedAt,
  };
};

const PLACE_SEEDS: [number, string, boolean][] = [
  [1, "9100001", true],
  [2, "9100002", true],
  [3, "9100003", false],
  [4, "9100004", true],
  [5, "9100005", false],
  [6, "9100006", true],
  [7, "9100008", true],
  [8, "9100009", false],
  [9, "9100014", true],
];

type RecordSeed = {
  activity: string;
  author: string;
  category: string;
  daysAgo: number;
  index: number;
  length?: number;
  memo?: string;
  placeIndexes?: number[];
  /** 장소가 데려온 지역은 false, 직접 고른 지역은 true. */
  regions: [string, boolean][];
  weather: string;
};

const { jimin, seojun } = DEMO_MEMBER_IDS;

const RECORD_SEEDS: RecordSeed[] = [
  {
    activity: "망원 한강 피크닉",
    author: jimin,
    category: "date",
    daysAgo: 1,
    index: 1,
    memo: "돗자리 펴고 노을 질 때까지 있었다.\n다음엔 자전거도 타 보자.",
    placeIndexes: [1, 9],
    regions: [["1144012000", false]],
    weather: "sunny",
  },
  {
    activity: "성수동 카페 투어",
    author: seojun,
    category: "daily",
    daysAgo: 4,
    index: 2,
    memo: "원두 두 봉지 사 왔다.",
    placeIndexes: [2],
    regions: [["1120011500", false]],
    weather: "cloudy",
  },
  {
    activity: "삼청동 골목 산책",
    author: jimin,
    category: "date",
    daysAgo: 9,
    index: 3,
    placeIndexes: [3],
    regions: [["1111014000", false]],
    weather: "partly_cloudy",
  },
  {
    activity: "부산 바다 여행",
    author: seojun,
    category: "travel",
    daysAgo: 16,
    index: 4,
    length: 3,
    memo: "해운대에서 시작해서 광안리 야경으로 마무리.",
    placeIndexes: [4, 5],
    regions: [
      ["2635010500", false],
      ["2650010200", false],
    ],
    weather: "sunny",
  },
  {
    activity: "친구들과 수원 화성 나들이",
    author: jimin,
    category: "gathering",
    daysAgo: 22,
    index: 5,
    placeIndexes: [8],
    regions: [["4111514000", false]],
    weather: "sunny",
  },
  {
    activity: "제주 애월 여행",
    author: seojun,
    category: "travel",
    daysAgo: 30,
    index: 6,
    length: 3,
    memo: "비가 와서 오히려 조용했다.",
    placeIndexes: [6],
    regions: [
      ["4911025000", false],
      ["4913011000", true],
    ],
    weather: "rainy",
  },
  {
    activity: "강릉 커피 여행",
    author: jimin,
    category: "travel",
    daysAgo: 38,
    index: 7,
    placeIndexes: [7],
    regions: [["5115010600", false]],
    weather: "cloudy",
  },
  {
    activity: "1주년 기념 저녁",
    author: seojun,
    category: "anniversary",
    daysAgo: 45,
    index: 8,
    memo: "처음 만난 동네에서 다시 저녁을 먹었다.",
    regions: [["1168010100", true]],
    weather: "sunny",
  },
  {
    activity: "여수 밤바다",
    author: jimin,
    category: "travel",
    daysAgo: 53,
    index: 9,
    regions: [["4613010100", true]],
    weather: "partly_cloudy",
  },
  {
    activity: "경주 황리단길 산책",
    author: seojun,
    category: "date",
    daysAgo: 61,
    index: 10,
    regions: [["4713011500", true]],
    weather: "cloudy",
  },
];

const createMembers = (createdAt: string): AccountMember[] =>
  [
    [jimin, "지민"],
    [seojun, "서준"],
  ].map(([id, name], index) => ({
    created_at: timestampOf(createdAt, index),
    id,
    is_active: true,
    name,
    owner_id: demoId("e", 1),
    updated_at: timestampOf(createdAt, index),
  }));

export const createSeedState = (today: string): DemoState => {
  const firstDay = shiftDate(today, -90);
  const places = PLACE_SEEDS.map(([index, kakaoId, saved]) => {
    const kakao = getDemoKakaoPlace(kakaoId);
    if (!kakao) throw new Error(`Unknown demo place: ${kakaoId}`);
    const createdAt = timestampOf(shiftDate(today, -80 + index), index);
    return toDemoPlace(kakao, demoId("c", index), createdAt, saved ? createdAt : null);
  });

  const records: DemoRecord[] = RECORD_SEEDS.map((seed) => {
    const recordedAt = shiftDate(today, -seed.daysAgo);
    return {
      activity: seed.activity,
      author_member_id: seed.author,
      category: [seed.category],
      created_at: timestampOf(recordedAt, seed.index * 7),
      id: demoId("b", seed.index),
      memo: seed.memo ?? null,
      placeIds: (seed.placeIndexes ?? []).map((index) => demoId("c", index)),
      recorded_at: recordedAt,
      recorded_until: seed.length ? shiftDate(recordedAt, seed.length - 1) : null,
      regions: seed.regions.map(([code, selectedDirectly]) => toDemoRegion(code, selectedDirectly)),
      weather: seed.weather,
    };
  });

  const recordDate = (index: number) => records[index - 1].recorded_at;
  const comment = (
    index: number,
    recordIndex: number,
    author: string,
    body: string,
    minute: number,
  ): RecordComment => ({
    author: { name: author === jimin ? "지민" : "서준" },
    author_member_id: author,
    body,
    created_at: timestampOf(recordDate(recordIndex), minute),
    id: demoId("d", index),
    record_id: demoId("b", recordIndex),
  });
  const comments = [
    comment(1, 1, seojun, "노을 진짜 예뻤어. 사진 보내 줘!", 30),
    comment(2, 1, jimin, "다음 주에 자전거 빌려서 또 가자.", 45),
    comment(3, 4, jimin, "광안리 야경은 다시 봐도 좋다.", 20),
    comment(4, 6, jimin, "비 와도 좋았던 여행.", 10),
  ];

  let notificationId = 0;
  const notification = (
    recipient: string,
    eventType: DemoNotification["event_type"],
    recordIndex: number | null,
    commentIndex: number | null,
    read: boolean,
    createdAt: string,
    title?: string,
  ): DemoNotification => {
    notificationId += 1;
    const record = recordIndex ? records[recordIndex - 1] : null;
    return {
      comment_id: commentIndex ? demoId("d", commentIndex) : null,
      created_at: createdAt,
      event_type: eventType,
      id: notificationId,
      read_at: read ? createdAt : null,
      recipient_member_id: recipient,
      record_id: record?.id ?? null,
      record_title: title ?? record?.activity ?? "",
      sender_name: recipient === jimin ? "서준" : "지민",
    };
  };
  const notifications = [
    notification(jimin, "record_created", null, null, true, timestampOf(shiftDate(today, -70), 0), "봄 소풍"),
    notification(jimin, "record_created", 4, null, true, records[3].created_at),
    notification(jimin, "record_created", 2, null, false, records[1].created_at),
    notification(jimin, "comment_created", 1, 1, false, comments[0].created_at),
    notification(seojun, "record_created", 3, null, true, records[2].created_at),
    notification(seojun, "record_created", 1, null, false, records[0].created_at),
    notification(seojun, "comment_created", 1, 2, false, comments[1].created_at),
  ];

  return {
    changed: false,
    comments,
    currentMemberId: jimin,
    members: createMembers(firstDay),
    nextNotificationId: notificationId + 1,
    notifications,
    places,
    recordView: null,
    records,
    sampleCursor: 0,
    theme: "system",
    today,
    version: DEMO_STATE_VERSION,
  };
};
