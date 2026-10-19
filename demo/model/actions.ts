import { MAX_VISITED_REGIONS } from "@/entities/record/model/limits";
import type { RecordInput } from "@/entities/record/model/record-form";
import { getRecordRegionKey } from "@/entities/record/model/record-region";
import type { RecordComment } from "@/entities/record-comment/model/record-comment";

import { DEMO_REGIONS, getDemoKakaoPlace } from "./samples.ts";
import { shiftDate, toDemoPlace, toDemoRegion } from "./seed.ts";
import type { DemoNotification, DemoPlace, DemoRecord, DemoRegion, DemoState } from "./types.ts";

type Context = { createId: () => string; now: string };

type DemoActionFailure = { message: string; ok: false };

export type DemoActionResult<T = object> = DemoActionFailure | ({ ok: true; state: DemoState } & T);

const fail = (message: string): DemoActionFailure => ({ message, ok: false });

const changed = (state: DemoState, patch: Partial<DemoState>): DemoState => ({ ...state, ...patch, changed: true });

const memberName = (state: DemoState, memberId: string) =>
  state.members.find((member) => member.id === memberId && member.is_active)?.name;

/** 작성자를 뺀 활성 구성원에게 알림을 남긴다. 같은 대상에 이미 있으면 다시 만들지 않는다(DB의 unique 제약). */
const notifyOthers = (
  state: DemoState,
  senderId: string,
  event: Pick<DemoNotification, "comment_id" | "event_type" | "record_id" | "record_title">,
  now: string,
) => {
  const senderName = memberName(state, senderId);
  if (!senderName) return state;

  let nextId = state.nextNotificationId;
  const additions = state.members
    .filter((member) => member.is_active && member.id !== senderId)
    .filter(
      (member) =>
        !state.notifications.some(
          (notification) =>
            notification.recipient_member_id === member.id &&
            notification.event_type === event.event_type &&
            (event.event_type === "comment_created"
              ? notification.comment_id === event.comment_id
              : notification.record_id === event.record_id),
        ),
    )
    .map((member): DemoNotification => {
      nextId += 1;
      return {
        ...event,
        created_at: now,
        id: nextId - 1,
        read_at: null,
        recipient_member_id: member.id,
        sender_name: senderName,
      };
    });

  return { ...state, nextNotificationId: nextId, notifications: [...state.notifications, ...additions] };
};

/** 기록에서 빠진 장소 중 저장하지 않은 곳은 지운다(cleanup_unlinked_record_place 트리거와 같은 규칙). */
const removeOrphanPlaces = (state: DemoState) => ({
  ...state,
  places: state.places.filter(
    (place) => place.saved_at || state.records.some((record) => record.placeIds.includes(place.id)),
  ),
});

const knownRegion = (state: DemoState, code: string) =>
  DEMO_REGIONS.find((region) => region.code === code) ??
  state.records
    .flatMap((record) => record.regions)
    .map((region) => ({
      code: region.region_code,
      fullName: region.region_name,
      latitude: region.region_latitude,
      longitude: region.region_longitude,
      name: region.region_label,
    }))
    .find((region) => region.code === code);

/**
 * 서버의 validateRecordSelections와 같은 순서로 방문 지역과 장소를 정한다.
 * 직접 고른 지역이 먼저, 장소가 데려온 지역이 뒤에 온다. 첫 지역이 대표 지역이다.
 */
const resolveSelections = (state: DemoState, input: RecordInput, { createId, now }: Context) => {
  let places = state.places;
  const placeIds: string[] = [];
  const placeRegions: DemoRegion[] = [];

  for (const reference of input.places) {
    let place: DemoPlace | undefined;
    if (reference.kind === "existing") {
      place = places.find(({ id }) => id === reference.placeId);
    } else {
      const kakao = getDemoKakaoPlace(reference.providerPlaceId);
      place = places.find((candidate) => candidate.provider_place_id === reference.providerPlaceId);
      if (!place && kakao) {
        place = toDemoPlace(kakao, createId(), now, null);
        places = [...places, place];
      }
    }
    const regionName = place?.region_name;
    if (!place || !regionName) return null;

    if (reference.save && !place.saved_at) {
      const saved: DemoPlace = { ...place, saved_at: now };
      places = places.map((candidate) => (candidate.id === saved.id ? saved : candidate));
      place = saved;
    }
    placeIds.push(place.id);
    placeRegions.push(toDemoRegion(place.region_code, false, regionName.split(" ").at(-1)));
  }

  const regions = new Map<string, DemoRegion>();
  for (const selected of input.regions) {
    const region = knownRegion(state, selected.code);
    if (!region) return null;
    const key = getRecordRegionKey(selected);
    if (!regions.has(key)) {
      regions.set(key, {
        region_code: region.code,
        region_label: selected.label,
        region_latitude: region.latitude,
        region_longitude: region.longitude,
        region_name: region.fullName,
        selected_directly: true,
      });
    }
  }
  for (const region of placeRegions) {
    if ([...regions.values()].some((selected) => selected.region_code === region.region_code)) continue;
    regions.set(getRecordRegionKey({ code: region.region_code, label: region.region_label }), region);
  }

  if (regions.size < 1 || regions.size > MAX_VISITED_REGIONS) return null;
  return { placeIds, places, regions: [...regions.values()] };
};

export const createRecord = (state: DemoState, input: RecordInput, authorId: string, context: Context) => {
  const selections = resolveSelections(state, input, context);
  if (!selections) return fail("선택한 지역·장소를 확인할 수 없습니다.");

  const record: DemoRecord = {
    activity: input.activity,
    author_member_id: authorId,
    category: input.category,
    created_at: context.now,
    id: context.createId(),
    memo: input.memo ?? null,
    placeIds: selections.placeIds,
    recorded_at: input.recordedAt,
    recorded_until: input.recordedUntil ?? null,
    regions: selections.regions,
    weather: input.weather,
  };
  const next = changed(state, { places: selections.places, records: [...state.records, record] });

  return {
    ok: true as const,
    recordId: record.id,
    state: notifyOthers(
      next,
      authorId,
      { comment_id: null, event_type: "record_created", record_id: record.id, record_title: record.activity },
      context.now,
    ),
  };
};

export const updateRecord = (state: DemoState, recordId: string, input: RecordInput, context: Context) => {
  const record = state.records.find(({ id }) => id === recordId);
  if (!record) return fail("수정할 기록이나 선택 항목을 확인할 수 없습니다.");

  const selections = resolveSelections(state, input, context);
  if (!selections) return fail("수정할 기록이나 선택 항목을 확인할 수 없습니다.");

  const updated: DemoRecord = {
    ...record,
    activity: input.activity,
    category: input.category,
    memo: input.memo ?? null,
    placeIds: selections.placeIds,
    recorded_at: input.recordedAt,
    recorded_until: input.recordedUntil ?? null,
    regions: selections.regions,
    weather: input.weather,
  };

  return {
    ok: true as const,
    state: removeOrphanPlaces(
      changed(state, {
        places: selections.places,
        records: state.records.map((candidate) => (candidate.id === recordId ? updated : candidate)),
      }),
    ),
  };
};

/** 기록과 댓글을 지우고, 알림은 남기되 대상 연결만 끊는다(ON DELETE SET NULL). */
export const deleteRecord = (state: DemoState, recordId: string): DemoActionResult => {
  if (!state.records.some(({ id }) => id === recordId))
    return fail("기록을 삭제하지 못했습니다.\n잠시 후 다시 시도해 주세요.");

  const removedComments = new Set(
    state.comments.filter((comment) => comment.record_id === recordId).map(({ id }) => id),
  );
  return {
    ok: true,
    state: removeOrphanPlaces(
      changed(state, {
        comments: state.comments.filter((comment) => comment.record_id !== recordId),
        notifications: state.notifications.map((notification) =>
          notification.record_id === recordId ||
          (notification.comment_id && removedComments.has(notification.comment_id))
            ? { ...notification, comment_id: null, record_id: null }
            : notification,
        ),
        records: state.records.filter(({ id }) => id !== recordId),
      }),
    ),
  };
};

export const createComment = (
  state: DemoState,
  input: { body: string; commentId: string; recordId: string },
  authorId: string,
  now: string,
) => {
  const record = state.records.find(({ id }) => id === input.recordId);
  const author = memberName(state, authorId);
  if (!record || !author) return fail("잠시 후 다시 시도해 주세요.");

  const comment: RecordComment = {
    author: { name: author },
    author_member_id: authorId,
    body: input.body,
    created_at: now,
    id: input.commentId,
    record_id: record.id,
  };

  return {
    comment,
    ok: true as const,
    state: notifyOthers(
      changed(state, { comments: [...state.comments, comment] }),
      authorId,
      { comment_id: comment.id, event_type: "comment_created", record_id: record.id, record_title: record.activity },
      now,
    ),
  };
};

/** 본인 댓글만 지운다. 다른 구성원 댓글은 서버 조건(author_member_id)에 걸려 실패한다. */
export const deleteComment = (state: DemoState, input: { commentId: string; recordId: string }, memberId: string) => {
  const comment = state.comments.find(({ id, record_id }) => id === input.commentId && record_id === input.recordId);
  if (!comment || comment.author_member_id !== memberId) return fail("댓글이 이미 변경됐거나 삭제할 수 없어요.");

  return {
    commentId: comment.id,
    ok: true as const,
    state: changed(state, {
      comments: state.comments.filter(({ id }) => id !== comment.id),
      notifications: state.notifications.map((notification) =>
        notification.comment_id === comment.id ? { ...notification, comment_id: null } : notification,
      ),
    }),
  };
};

export const setPlaceSaved = (state: DemoState, placeId: string, saved: boolean, now: string): DemoActionResult => {
  if (!state.places.some(({ id }) => id === placeId)) return fail("장소 저장 상태를 변경하지 못했어요.");

  return {
    ok: true,
    state: changed(state, {
      places: state.places.map((place) => (place.id === placeId ? { ...place, saved_at: saved ? now : null } : place)),
    }),
  };
};

export const createPlaces = (state: DemoState, providerPlaceIds: string[], context: Context): DemoActionResult => {
  let places = state.places;
  for (const providerPlaceId of providerPlaceIds) {
    const kakao = getDemoKakaoPlace(providerPlaceId);
    if (!kakao) return fail("선택한 장소를 확인할 수 없습니다. 다시 검색해 주세요.");

    const existing = places.find((place) => place.provider_place_id === providerPlaceId);
    places = existing
      ? places.map((place) => (place.id === existing.id ? { ...place, saved_at: context.now } : place))
      : [...places, toDemoPlace(kakao, context.createId(), context.now, context.now)];
  }

  return { ok: true, state: changed(state, { places }) };
};

/** 기록에 쓰인 장소는 저장만 해제하고, 아니면 지운다(remove_saved_place와 같은 규칙). */
export const deletePlace = (state: DemoState, placeId: string): DemoActionResult => {
  if (!state.places.some(({ id }) => id === placeId))
    return fail("장소를 삭제하지 못했습니다.\n잠시 후 다시 시도해 주세요.");

  const used = state.records.some((record) => record.placeIds.includes(placeId));
  return {
    ok: true,
    state: changed(state, {
      places: used
        ? state.places.map((place) => (place.id === placeId ? { ...place, saved_at: null } : place))
        : state.places.filter(({ id }) => id !== placeId),
    }),
  };
};

export const readAllNotifications = (state: DemoState, memberId: string, now: string): DemoState =>
  changed(state, {
    notifications: state.notifications.map((notification) =>
      notification.recipient_member_id === memberId && !notification.read_at
        ? { ...notification, read_at: now }
        : notification,
    ),
  });

export const readRecordNotifications = (state: DemoState, memberId: string, recordId: string, now: string): DemoState =>
  changed(state, {
    notifications: state.notifications.map((notification) =>
      notification.recipient_member_id === memberId && notification.record_id === recordId && !notification.read_at
        ? { ...notification, read_at: now }
        : notification,
    ),
  });

const SAMPLE_RECORDS = [
  { activity: "대전 빵지순례", category: "daily", daysAgo: 0, region: "3014010100", weather: "sunny" },
  { activity: "남포동 시장 구경", category: "gathering", daysAgo: 2, region: "2611010000", weather: "cloudy" },
  { activity: "청주 골목 산책", category: "date", daysAgo: 6, region: "4311112000", weather: "partly_cloudy" },
] as const;

/** 미리 정한 예시를 차례로 꺼내 지금 사용자의 기록으로 추가한다. */
export const addSampleRecord = (state: DemoState, authorId: string, context: Context) => {
  const sample = SAMPLE_RECORDS[state.sampleCursor % SAMPLE_RECORDS.length];
  const result = createRecord(
    state,
    {
      activity: sample.activity,
      category: sample.category,
      places: [],
      recordedAt: shiftDate(state.today, -sample.daysAgo),
      regions: [{ code: sample.region, label: toDemoRegion(sample.region, true).region_label, name: "" }],
      weather: sample.weather,
    },
    authorId,
    context,
  );
  if (!result.ok) return result;
  return { ...result, activity: sample.activity, state: { ...result.state, sampleCursor: state.sampleCursor + 1 } };
};

/**
 * 다른 구성원이 보낸 알림을 하나 받는다. 아직 알림이 없는 그 사람의 기록이 있으면 새 기록 알림을,
 * 없으면 최근 기록에 그 사람의 댓글을 달아 댓글 알림을 만든다.
 */
export const receiveNotification = (state: DemoState, recipientId: string, context: Context) => {
  const sender = state.members.find((member) => member.is_active && member.id !== recipientId);
  if (!sender) return fail("알림을 보낼 다른 구성원이 없어요.");

  const unnotifiedRecord = [...state.records]
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
    .find(
      (record) =>
        record.author_member_id === sender.id &&
        !state.notifications.some(
          (notification) =>
            notification.recipient_member_id === recipientId &&
            notification.event_type === "record_created" &&
            notification.record_id === record.id,
        ),
    );

  if (unnotifiedRecord) {
    const next = notifyOthers(
      changed(state, {}),
      sender.id,
      {
        comment_id: null,
        event_type: "record_created",
        record_id: unnotifiedRecord.id,
        record_title: unnotifiedRecord.activity,
      },
      context.now,
    );
    return {
      ok: true as const,
      recordId: unnotifiedRecord.id,
      commentId: null,
      state: next,
      title: unnotifiedRecord.activity,
    };
  }

  const target = [...state.records].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0];
  if (!target) return fail("알림을 연결할 기록이 없어요. 예시 기록을 먼저 추가해 주세요.");

  const result = createComment(
    state,
    { body: "이날 정말 좋았어. 또 가자!", commentId: context.createId(), recordId: target.id },
    sender.id,
    context.now,
  );
  if (!result.ok) return result;
  return {
    ok: true as const,
    recordId: target.id,
    commentId: result.comment.id,
    state: result.state,
    title: target.activity,
  };
};
