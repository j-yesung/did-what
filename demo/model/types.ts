import type { AccountMember } from "@/entities/member/model/types";
import type { RecordComment } from "@/entities/record-comment/model/record-comment";
import type { RecordView } from "@/features/record/switch-record-view/model/record-view-preference";
import type { Theme } from "@/features/switch-theme/model/theme";

/** 실제 record_regions 행과 같은 모양. 첫 지역이 기록의 대표 지역이다. */
export type DemoRegion = {
  region_code: string;
  region_label: string;
  region_latitude: number;
  region_longitude: number;
  region_name: string;
  selected_directly: boolean;
};

export type DemoRecord = {
  activity: string;
  author_member_id: string;
  category: string[];
  created_at: string;
  id: string;
  memo: string | null;
  placeIds: string[];
  recorded_at: string;
  recorded_until: string | null;
  regions: DemoRegion[];
  weather: string;
};

/** 실제 places 행과 같은 모양. saved_at이 없으면 기록에만 쓰인 장소다. */
export type DemoPlace = {
  address: string | null;
  category_group_code: string | null;
  category_name: string | null;
  created_at: string;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  provider: string | null;
  provider_place_id: string | null;
  region_code: string;
  region_name: string | null;
  saved_at: string | null;
};

export type DemoNotification = {
  comment_id: string | null;
  created_at: string;
  event_type: "comment_created" | "record_created";
  id: number;
  read_at: string | null;
  recipient_member_id: string;
  record_id: string | null;
  record_title: string;
  sender_name: string;
};

export type DemoState = {
  /** 처음 상태와 달라졌는지. 초기화 전에 확인을 받을지 정한다. */
  changed: boolean;
  comments: RecordComment[];
  currentMemberId: string | null;
  members: AccountMember[];
  nextNotificationId: number;
  notifications: DemoNotification[];
  places: DemoPlace[];
  recordView: RecordView | null;
  records: DemoRecord[];
  /** 예시 기록 추가를 누를 때마다 다음 예시를 꺼낸다. */
  sampleCursor: number;
  theme: Theme;
  /** 샘플 날짜의 기준일. 새로 고쳐도 같은 날짜를 유지한다. */
  today: string;
  version: number;
};
