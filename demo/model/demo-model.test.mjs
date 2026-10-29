import { sortPrimaryRecordRegions } from "@/entities/record/model/record-region";

import { toAppHref, toDemoHref, toSafeAppPath } from "../lib/demo-href.ts";
import { readDemoCommand, toCommandMessage } from "../lib/messages.ts";
import {
  addSampleRecord,
  createComment,
  createRecord,
  deleteComment,
  deletePlace,
  deleteRecord,
  receiveNotification,
  updateRecord,
} from "./actions.ts";
import { getRecordPage, resolveDemoQuery } from "./queries.ts";
import { createSeedState, DEMO_MEMBER_IDS, DEMO_RECORD_IDS, demoId } from "./seed.ts";
import assert from "node:assert/strict";
import test from "node:test";

const TODAY = "2026-10-12";
let sequence = 0;
const context = () => ({
  createId: () => `00000000-0000-4000-8000-f${String((sequence += 1)).padStart(11, "0")}`,
  now: "2026-10-12T03:00:00.000Z",
});
const FILTERS = { category: "", from: "", query: "", sort: "recent", to: "" };

test("처음 샘플은 구성원 2명과 서로 연결된 기록·장소·댓글·알림으로 시작한다", () => {
  const state = createSeedState(TODAY);
  const recordIds = new Set(state.records.map(({ id }) => id));
  const placeIds = new Set(state.places.map(({ id }) => id));

  assert.equal(state.members.length, 2);
  assert.ok(state.records.length >= 8 && state.records.length <= 12);
  assert.ok(state.records.some(({ recorded_at }) => recorded_at.startsWith(TODAY.slice(0, 7))));
  assert.ok(state.records.every((record) => record.placeIds.every((id) => placeIds.has(id))));
  assert.ok(state.comments.every((comment) => recordIds.has(comment.record_id)));
  assert.ok(
    state.notifications.every(
      (notification) =>
        notification.record_id === null ||
        (recordIds.has(notification.record_id) &&
          (notification.comment_id === null || state.comments.some(({ id }) => id === notification.comment_id))),
    ),
  );
});

test("기록 목록은 실제 조회처럼 걸러 정렬하고, 20개씩 끊어 이어 받는다", () => {
  let state = createSeedState(TODAY);
  // 예시 기록을 더해 한 페이지(20개)를 넘긴다.
  for (let index = 0; index < 12; index += 1) {
    const result = addSampleRecord(state, DEMO_MEMBER_IDS.jimin, context());
    state = result.state;
  }
  const first = getRecordPage(state, FILTERS, null);
  const second = getRecordPage(state, FILTERS, first.nextCursor);

  assert.equal(first.records.length, 20);
  assert.equal(second.nextCursor, null);
  assert.equal(new Set([...first.records, ...second.records].map(({ id }) => id)).size, state.records.length);
  assert.deepEqual(
    getRecordPage(createSeedState(TODAY), { ...FILTERS, query: "부산" }, null).records.map(({ id }) => id),
    [DEMO_RECORD_IDS.busan],
  );

  const oldest = getRecordPage(state, { ...FILTERS, sort: "oldest" }, null).records;
  assert.ok(oldest[0].recorded_at <= oldest.at(-1).recorded_at);

  // 여러 날 기록은 마지막 날이 기간에 걸치면 포함한다.
  const busan = state.records.find(({ id }) => id === DEMO_RECORD_IDS.busan);
  const period = { ...FILTERS, from: busan.recorded_until, to: busan.recorded_until };
  assert.ok(getRecordPage(state, period, null).records.some(({ id }) => id === DEMO_RECORD_IDS.busan));
});

test("기록을 지우면 댓글은 지워지고 알림은 남되 연결이 끊긴다. 저장하지 않은 장소만 함께 지운다", () => {
  const state = createSeedState(TODAY);
  const result = deleteRecord(state, DEMO_RECORD_IDS.hangang);

  assert.equal(result.ok, true);
  const next = result.state;
  assert.equal(
    next.comments.some(({ record_id }) => record_id === DEMO_RECORD_IDS.hangang),
    false,
  );
  assert.equal(
    next.notifications.some(({ record_id }) => record_id === DEMO_RECORD_IDS.hangang),
    false,
  );
  assert.ok(next.notifications.length === state.notifications.length);
  // 한강 기록의 장소는 둘 다 저장한 장소라 남는다.
  assert.ok(next.places.some(({ id }) => id === demoId("c", 1)));

  const busan = deleteRecord(state, DEMO_RECORD_IDS.busan).state;
  // 광안리 카페(c5)는 저장하지 않은 장소라 기록과 함께 사라진다.
  assert.equal(
    busan.places.some(({ id }) => id === demoId("c", 5)),
    false,
  );
  assert.ok(busan.places.some(({ id }) => id === demoId("c", 4)));
  assert.equal(resolveDemoQuery(busan, ["records", "detail", DEMO_RECORD_IDS.busan], undefined), null);
});

test("댓글을 남기면 다른 구성원에게 알림이 가고, 남의 댓글은 지울 수 없다", () => {
  const state = createSeedState(TODAY);
  const commentCount = (data) =>
    resolveDemoQuery(data, ["records", "locations"], undefined).find(({ id }) => id === DEMO_RECORD_IDS.seongsu)
      .record_comments[0].count;
  const initialCount = commentCount(state);
  const created = createComment(
    state,
    { body: "좋았어", commentId: demoId("d", 50), recordId: DEMO_RECORD_IDS.seongsu },
    DEMO_MEMBER_IDS.jimin,
    context().now,
  );

  assert.equal(created.ok, true);
  assert.equal(commentCount(created.state), initialCount + 1);
  const notification = created.state.notifications.at(-1);
  assert.equal(notification.recipient_member_id, DEMO_MEMBER_IDS.seojun);
  assert.equal(notification.comment_id, demoId("d", 50));
  assert.equal(
    resolveDemoQuery(created.state, ["notifications", DEMO_MEMBER_IDS.seojun, "unread-count"], undefined),
    resolveDemoQuery(state, ["notifications", DEMO_MEMBER_IDS.seojun, "unread-count"], undefined) + 1,
  );

  const otherComment = state.comments.find(({ author_member_id }) => author_member_id === DEMO_MEMBER_IDS.seojun);
  const denied = deleteComment(
    state,
    { commentId: otherComment.id, recordId: otherComment.record_id },
    DEMO_MEMBER_IDS.jimin,
  );
  assert.equal(denied.ok, false);

  const own = deleteComment(
    created.state,
    { commentId: demoId("d", 50), recordId: DEMO_RECORD_IDS.seongsu },
    DEMO_MEMBER_IDS.jimin,
  );
  assert.equal(own.ok, true);
  assert.equal(commentCount(own.state), initialCount);
  assert.equal(own.state.notifications.at(-1).comment_id, null);
});

test("기록에 쓰인 장소를 지우면 저장만 해제하고, 쓰이지 않은 장소는 지운다", () => {
  const state = createSeedState(TODAY);
  const used = deletePlace(state, demoId("c", 1)).state;
  assert.equal(used.places.find(({ id }) => id === demoId("c", 1)).saved_at, null);

  const unused = deletePlace(used, demoId("c", 1));
  assert.equal(unused.ok, true);
  const withoutRecords = deletePlace(deleteRecord(state, DEMO_RECORD_IDS.hangang).state, demoId("c", 9)).state;
  assert.equal(
    withoutRecords.places.some(({ id }) => id === demoId("c", 9)),
    false,
  );
});

test("새 알림은 실제로 있는 기록이나 댓글을 가리킨다", () => {
  let state = createSeedState(TODAY);
  for (let index = 0; index < 5; index += 1) {
    const result = receiveNotification(state, DEMO_MEMBER_IDS.jimin, context());
    assert.equal(result.ok, true);
    state = result.state;
    assert.ok(state.records.some(({ id }) => id === result.recordId));
    if (result.commentId) assert.ok(state.comments.some(({ id }) => id === result.commentId));
  }
});

test("앱 경로는 /demo/app 한 페이지의 path 쿼리로 옮기고 되돌린다", () => {
  assert.equal(toDemoHref("/"), "/demo/app");
  assert.equal(toDemoHref("/records?view=calendar"), "/demo/app?path=%2Frecords&view=calendar");
  assert.equal(toDemoHref("/?region=KR-11"), "/demo/app?region=KR-11");
  assert.equal(
    toDemoHref("/records/1?from=notification#comment-2"),
    "/demo/app?path=%2Frecords%2F1&from=notification#comment-2",
  );
  assert.equal(toDemoHref("/demo/app?path=%2Fplaces"), "/demo/app?path=%2Fplaces");
  assert.equal(toDemoHref("?record-create.step=where"), "?record-create.step=where");
  assert.equal(toDemoHref("/demo"), "/demo");
  assert.equal(toDemoHref("https://example.com"), "https://example.com");
  assert.equal(toDemoHref("//example.com"), "//example.com");
  assert.equal(
    toAppHref("?path=%2Frecords&view=list&record-create.step=when"),
    "/records?view=list&record-create.step=when",
  );
  assert.equal(toAppHref(""), "/");
  assert.equal(toAppHref("?path=%2F%2Fevil.example"), "/");
  assert.equal(toSafeAppPath("//evil.example"), "/");
  assert.equal(toSafeAppPath("/demo/app"), "/");
  assert.equal(toSafeAppPath("/records/1"), "/records/1");
});

test("부모가 보낸 명령은 정해진 이름과 값만 받는다", () => {
  assert.deepEqual(readDemoCommand(toCommandMessage({ name: "addRecord" })), { name: "addRecord" });
  assert.deepEqual(readDemoCommand(toCommandMessage({ name: "navigate", path: "//evil.example" })), {
    name: "navigate",
    path: "/",
  });
  assert.equal(readDemoCommand(toCommandMessage({ name: "setTheme", theme: "neon" })), null);
  assert.equal(readDemoCommand(toCommandMessage({ memberId: 1, name: "switchMember" })), null);
  assert.equal(readDemoCommand({ command: { name: "addRecord" }, source: "other", type: "command" }), null);
  assert.equal(readDemoCommand(toCommandMessage({ code: "alert(1)", name: "eval" })), null);
});

test("카테고리 필터는 검색·기간·정렬과 함께 다음 페이지까지 유지된다", () => {
  const state = createSeedState(TODAY);
  const busan = state.records.find(({ id }) => id === DEMO_RECORD_IDS.busan);
  state.records.push(
    ...Array.from({ length: 25 }, (_, index) => ({
      ...busan,
      id: demoId("b", index + 100),
      activity: `부산 바다 ${index}`,
    })),
  );
  const filters = {
    ...FILTERS,
    category: "travel",
    query: "부산",
    from: busan.recorded_at,
    to: busan.recorded_until,
    sort: "oldest",
  };
  const first = getRecordPage(state, filters, null);
  const second = getRecordPage(state, filters, first.nextCursor);
  assert.equal(first.records.length, 20);
  assert.equal(second.records.length, 6);
  assert.equal(second.nextCursor, null);
  const rows = [...first.records, ...second.records];
  assert.equal(new Set(rows.map((row) => row.id)).size, 26);
  assert.ok(rows.every((row) => row.category.includes("travel") && row.activity.includes("부산")));
  assert.equal(getRecordPage(state, { ...filters, category: "daily" }, null).records.length, 0);
});

test("데모 생성·수정은 같은 지역의 다른 표시명을 보존하고 정확한 중복만 합친다", () => {
  const state = createSeedState(TODAY);
  const region = (label) => ({ code: "1144012000", label, name: "서울 마포구 망원동" });
  const input = {
    activity: "마포 산책",
    category: ["daily"],
    recordedAt: TODAY,
    weather: "sunny",
    regions: [region("마포구"), region("망원동"), region(" 망원동 ")],
    places: [{ kind: "existing", placeId: demoId("c", 1), save: false }],
  };
  const created = createRecord(state, input, DEMO_MEMBER_IDS.jimin, context());
  assert.equal(created.ok, true);
  const saved = created.state.records.find(({ id }) => id === created.recordId);
  assert.deepEqual(
    saved.regions.map(({ region_label }) => region_label),
    ["마포구", "망원동"],
  );
  assert.equal(new Set(saved.regions.map(({ region_code }) => region_code)).size, 1);
  assert.ok(saved.regions.every(({ selected_directly }) => selected_directly));
  assert.deepEqual(saved.placeIds, [demoId("c", 1)]);

  const updated = updateRecord(
    created.state,
    created.recordId,
    {
      ...input,
      regions: [region("마포구"), region("한강공원")],
    },
    context(),
  );
  assert.equal(updated.ok, true);
  assert.deepEqual(
    updated.state.records.find(({ id }) => id === created.recordId).regions.map(({ region_label }) => region_label),
    ["마포구", "한강공원"],
  );
});

test("데모도 표시명이 다른 방문 지역 항목은 최대 10개까지 저장한다", () => {
  const state = createSeedState(TODAY);
  const input = {
    activity: "마포 산책",
    category: ["daily"],
    recordedAt: TODAY,
    weather: "sunny",
    places: [],
    regions: Array.from({ length: 10 }, (_, index) => ({
      code: "1144012000",
      label: `방문 ${index}`,
      name: "서울 마포구 망원동",
    })),
  };
  const created = createRecord(state, input, DEMO_MEMBER_IDS.jimin, context());
  assert.equal(created.ok, true);
  assert.equal(created.state.records.find(({ id }) => id === created.recordId).regions.length, 10);
  assert.equal(
    createRecord(
      state,
      { ...input, regions: [...input.regions, { ...input.regions[0], label: "초과" }] },
      DEMO_MEMBER_IDS.jimin,
      context(),
    ).ok,
    false,
  );
});

test("조회 순서가 바뀐 기록의 메모만 수정해도 대표 표시명을 유지한다", () => {
  const input = {
    activity: "마포 산책",
    category: ["daily"],
    recordedAt: TODAY,
    weather: "sunny",
    places: [],
    regions: ["난지 한강공원", "디지털미디어시티"].map((label) => ({
      code: "1144012000",
      label,
      name: "서울 마포구 망원동",
    })),
  };
  const created = createRecord(createSeedState(TODAY), input, DEMO_MEMBER_IDS.jimin, context());
  assert.equal(created.ok, true);
  const detail = resolveDemoQuery(created.state, ["records", "detail", created.recordId], undefined);
  const regions = sortPrimaryRecordRegions(detail.record_regions.toReversed(), detail.region_code, detail.region_label)
    .filter(({ selected_directly }) => selected_directly)
    .map((region) => ({ code: region.region_code, label: region.region_label, name: region.region_name }));
  const updated = updateRecord(created.state, created.recordId, { ...input, regions, memo: "메모만 수정" }, context());
  assert.equal(updated.ok, true);
  const after = resolveDemoQuery(updated.state, ["records", "detail", created.recordId], undefined);
  assert.equal(after.region_label, "난지 한강공원");
  assert.equal(after.memo, "메모만 수정");
});

test("복수 카테고리는 각 카테고리 필터에서 조회되고 수정 후 미분류로 바꿀 수 있다", () => {
  const input = {
    activity: "둘이서 떠난 여행",
    category: ["date", "travel"],
    recordedAt: TODAY,
    weather: "sunny",
    places: [],
    regions: [{ code: "1144012000", label: "망원동", name: "서울 마포구 망원동" }],
  };
  const created = createRecord(createSeedState(TODAY), input, DEMO_MEMBER_IDS.jimin, context());
  assert.equal(created.ok, true);
  for (const category of input.category) {
    assert.ok(
      getRecordPage(created.state, { ...FILTERS, category }, null).records.some(({ id }) => id === created.recordId),
    );
  }
  const updated = updateRecord(created.state, created.recordId, { ...input, category: [] }, context());
  assert.equal(updated.ok, true);
  assert.deepEqual(resolveDemoQuery(updated.state, ["records", "detail", created.recordId], undefined).category, []);
  assert.ok(
    getRecordPage(updated.state, { ...FILTERS, category: "uncategorized" }, null).records.some(
      ({ id }) => id === created.recordId,
    ),
  );
  assert.ok(
    !getRecordPage(updated.state, { ...FILTERS, category: "date" }, null).records.some(
      ({ id }) => id === created.recordId,
    ),
  );
});
