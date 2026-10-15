import type { NotificationCursor } from "@/entities/notification/model/notification-page";
import type { RecordFilters } from "@/entities/record/model/record-filters";
import {
  compareRecordsByRecent,
  getRecordCursor,
  RECORD_PAGE_SIZE,
  type RecordCursor,
} from "@/entities/record/model/record-page";
import type { RecordCommentCursor } from "@/entities/record-comment/model/record-comment";
import type { KakaoPlace } from "@/shared/api/kakao-local/types";

import { type DemoKakaoPlace, searchDemoKakaoPlaces, searchDemoRegions } from "./samples.ts";
import type { DemoPlace, DemoRecord, DemoState } from "./types.ts";

// 실제 조회와 같은 페이지 크기. 상수 파일이 서버 전용 모듈을 함께 끌어오지 않도록 값만 맞춘다.
const NOTIFICATION_PAGE_SIZE = 20;
const RECORD_COMMENT_PAGE_SIZE = 20;

const placesOf = (state: DemoState, record: DemoRecord) =>
  record.placeIds.flatMap((id) => state.places.filter((place) => place.id === id));

const primaryRegionOf = (record: DemoRecord) => record.regions[0];

/** RECORD_LOCATION_COLUMNS와 같은 모양. */
const toLocationRow = (state: DemoState, record: DemoRecord) => ({
  activity: record.activity,
  category: record.category,
  created_at: record.created_at,
  id: record.id,
  record_places: placesOf(state, record).map(({ id, latitude, longitude, name }) => ({
    place: { id, latitude, longitude, name },
  })),
  record_regions: record.regions,
  recorded_at: record.recorded_at,
  recorded_until: record.recorded_until,
});

/** 목록·달력이 받는 RECORD_PAGE_COLUMNS와 같은 모양. */
const toPageRow = (state: DemoState, record: DemoRecord) => ({
  activity: record.activity,
  category: record.category,
  created_at: record.created_at,
  id: record.id,
  memo: record.memo,
  record_comments: [{ count: state.comments.filter((comment) => comment.record_id === record.id).length }],
  record_places: [{ count: record.placeIds.length }],
  record_regions: record.regions.map(({ region_code, region_label }) => ({ region_code, region_label })),
  recorded_at: record.recorded_at,
  recorded_until: record.recorded_until,
  region_code: primaryRegionOf(record)?.region_code,
  region_label: primaryRegionOf(record)?.region_label,
  region_name: primaryRegionOf(record)?.region_name,
  weather: record.weather,
});

/** RECORD_DETAIL_COLUMNS와 같은 모양. 수정 화면도 이 값으로 초기값을 만든다. */
export const toDetailRow = (state: DemoState, record: DemoRecord) => ({
  activity: record.activity,
  category: record.category,
  id: record.id,
  memo: record.memo,
  record_places: placesOf(state, record).map((place) => ({
    place: {
      address: place.address,
      category_group_code: place.category_group_code,
      category_name: place.category_name,
      id: place.id,
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      region_code: place.region_code,
      region_name: place.region_name,
      saved_at: place.saved_at,
    },
  })),
  record_regions: record.regions,
  recorded_at: record.recorded_at,
  recorded_until: record.recorded_until,
  region_code: primaryRegionOf(record)?.region_code ?? "",
  region_label: primaryRegionOf(record)?.region_label ?? "",
  weather: record.weather,
});

const toRecordPlacesRow = (state: DemoState, record: DemoRecord) => ({
  id: record.id,
  record_places: placesOf(state, record).map((place) => ({
    place: {
      address: place.address,
      category_group_code: place.category_group_code,
      category_name: place.category_name,
      id: place.id,
      name: place.name,
      saved_at: place.saved_at,
    },
  })),
  record_regions: record.regions.map(({ region_code, region_label, region_name }) => ({
    region_code,
    region_label,
    region_name,
  })),
});

const toPlaceDetailRow = ({ ...place }: DemoPlace) => place;

/** SAVED_PLACE_COLUMNS와 같은 모양. 기록 수는 이 장소를 쓰는 기록을 센다. */
export const toSavedPlaceRow = (state: DemoState, place: DemoPlace) => ({
  ...toPlaceDetailRow(place),
  record_places: [{ count: state.records.filter((record) => record.placeIds.includes(place.id)).length }],
});

export const getSavedPlaceRows = (state: DemoState) =>
  state.places
    .filter((place) => place.saved_at)
    .toSorted((a, b) => (b.saved_at ?? "").localeCompare(a.saved_at ?? "") || a.name.localeCompare(b.name, "ko"))
    .map((place) => toSavedPlaceRow(state, place));

const sortRecent = (records: readonly DemoRecord[]) => records.toSorted(compareRecordsByRecent);

/** 실제 or() 필터와 같은 기간 규칙. 여러 날 기록은 마지막 날이 기간에 들어오면 포함한다. */
const inPeriod = (record: DemoRecord, { from, to }: Pick<RecordFilters, "from" | "to">) => {
  if (from && (record.recorded_until ? record.recorded_until < from : record.recorded_at < from)) return false;
  if (to && record.recorded_at > to) return false;
  return true;
};

const matchesQuery = (record: DemoRecord, query: string) => {
  if (!query) return true;
  const primary = primaryRegionOf(record);
  const needle = query.toLocaleLowerCase("ko-KR");
  return [record.activity, record.memo, primary?.region_label, primary?.region_name].some((value) =>
    value?.toLocaleLowerCase("ko-KR").includes(needle),
  );
};

const isAfterCursor = (record: DemoRecord, cursor: RecordCursor, ascending: boolean) => {
  const order = compareRecordsByRecent(record, {
    created_at: cursor.createdAt,
    id: cursor.id,
    recorded_at: cursor.recordedAt,
  });
  return ascending ? order < 0 : order > 0;
};

export const getRecordPage = (state: DemoState, filters: RecordFilters, cursor: RecordCursor | null) => {
  const ascending = filters.sort === "oldest";
  const sorted = sortRecent(
    state.records.filter(
      (record) =>
        inPeriod(record, filters) &&
        matchesQuery(record, filters.query) &&
        (!filters.category || record.category === filters.category),
    ),
  );
  const ordered = ascending ? sorted.toReversed() : sorted;
  const remaining = cursor ? ordered.filter((record) => isAfterCursor(record, cursor, ascending)) : ordered;
  const records = remaining.slice(0, RECORD_PAGE_SIZE);

  return {
    nextCursor: remaining.length > RECORD_PAGE_SIZE ? getRecordCursor(records.at(-1)!) : null,
    records: records.map((record) => toPageRow(state, record)),
  };
};

const getMonthBounds = (state: DemoState) => {
  const dates = state.records
    .flatMap((record) => [record.recorded_at, record.recorded_until ?? record.recorded_at])
    .sort();
  return { firstMonth: dates[0]?.slice(0, 7) ?? null, lastMonth: dates.at(-1)?.slice(0, 7) ?? null };
};

/** created_at, id 내림차순으로 자르는 알림·댓글 공통 페이지. */
const pageByCreatedAt = <T extends { created_at: string; id: number | string }>(
  items: readonly T[],
  cursor: { createdAt: string; id: number | string } | null,
  size: number,
) => {
  const sorted = items.toSorted(
    (a, b) => b.created_at.localeCompare(a.created_at) || (b.id > a.id ? 1 : b.id < a.id ? -1 : 0),
  );
  const remaining = cursor
    ? sorted.filter(
        (item) => item.created_at < cursor.createdAt || (item.created_at === cursor.createdAt && item.id < cursor.id),
      )
    : sorted;
  const page = remaining.slice(0, size);
  const last = page.at(-1);
  return { nextCursor: remaining.length > size && last ? { createdAt: last.created_at, id: last.id } : null, page };
};

const toKakaoPlace = ({ regionCode: _regionCode, ...place }: DemoKakaoPlace): KakaoPlace => place;

const toPlaceSearchResult = (
  places: readonly DemoKakaoPlace[],
  query: string,
  scope: { latitude: number; longitude: number } | null,
) => ({
  isEnd: true,
  page: 1,
  pageableCount: places.length,
  places: places.map(toKakaoPlace),
  query,
  scope,
});

const readScope = (params: { latitude?: unknown; longitude?: unknown }) =>
  typeof params.latitude === "number" && typeof params.longitude === "number"
    ? { latitude: params.latitude, longitude: params.longitude }
    : null;

/**
 * 화면이 쓰는 query key를 샘플 데이터 조회로 바꾼다. 각 결과는 실제 Supabase 응답과 같은 모양이다.
 * 모르는 key는 실제 서버로 새지 않도록 오류로 끝낸다.
 */
export const resolveDemoQuery = (state: DemoState, queryKey: readonly unknown[], pageParam: unknown) => {
  const data = state;
  const [scope, second, third, fourth] = queryKey;
  const findRecord = (id: unknown) => data.records.find((record) => record.id === id);

  if (scope === "records") {
    if (second === "locations") return sortRecent(data.records).map((record) => toLocationRow(data, record));
    if (second === "month-bounds") return getMonthBounds(data);
    if (second === "list") return getRecordPage(data, third as RecordFilters, pageParam as RecordCursor | null);
    if (second === "calendar") {
      const period = third as Pick<RecordFilters, "from" | "to">;
      return sortRecent(data.records.filter((record) => inPeriod(record, period))).map((record) =>
        toPageRow(data, record),
      );
    }
    if (second === "detail") {
      const record = findRecord(third);
      if (fourth === "places") return record ? toRecordPlacesRow(data, record) : null;
      return record ? toDetailRow(data, record) : null;
    }
  }

  if (scope === "places") {
    if (second === undefined) return getSavedPlaceRows(data);
    if (second === "detail") {
      const place = data.places.find(({ id }) => id === third);
      return place ? toPlaceDetailRow(place) : null;
    }
    if (second === "records") {
      return data.records
        .filter((record) => record.placeIds.includes(String(third)))
        .map(({ activity, category, id, memo, recorded_at, recorded_until, weather }) => ({
          record: { activity, category, id, memo, recorded_at, recorded_until, weather },
        }));
    }
    if (second === "search") {
      const params = third as { latitude?: number; longitude?: number; query: string };
      const searchScope = readScope(params);
      return toPlaceSearchResult(searchDemoKakaoPlaces(params.query, searchScope), params.query.trim(), searchScope);
    }
  }

  if (scope === "place-search") {
    const query = String(second);
    return toPlaceSearchResult(searchDemoKakaoPlaces(query), query.trim(), null);
  }

  if (scope === "regions" && second === "search") {
    const query = String(third).trim();
    return { query, related: false, regions: searchDemoRegions(query) };
  }

  if (scope === "notifications") {
    const mine = data.notifications.filter((notification) => notification.recipient_member_id === second);
    if (third === "unread-count") return mine.filter((notification) => notification.read_at === null).length;
    if (third === "list") {
      const { nextCursor, page } = pageByCreatedAt(
        mine,
        pageParam as NotificationCursor | null,
        NOTIFICATION_PAGE_SIZE,
      );
      return {
        nextCursor,
        notifications: page.map(({ recipient_member_id: _recipient, ...notification }) => notification),
      };
    }
  }

  if (scope === "record-comments") {
    const comments = data.comments.filter((comment) => comment.record_id === second);
    const { nextCursor, page } = pageByCreatedAt(
      comments,
      pageParam as RecordCommentCursor | null,
      RECORD_COMMENT_PAGE_SIZE,
    );
    return { comments: page, nextCursor };
  }

  // 데모에서는 푸시를 지원하지 않는 기기로 보여 구독이 없다.
  if (scope === "push-endpoint") return null;

  throw new Error(`데모에서 지원하지 않는 조회예요: ${JSON.stringify(queryKey)}`);
};
