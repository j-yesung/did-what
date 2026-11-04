import { closeRecordSheet, openRecordSheet, toRecordSheetHref } from "./record-sheet.ts";
import assert from "node:assert/strict";
import test from "node:test";

test("시트를 열어도 날짜·검색 필터와 장소 배경이 유지된다", () => {
  assert.equal(
    toRecordSheetHref("/records/abc", "/records?from=2026-10-01&to=2026-10-31&q=cafe"),
    "/records?from=2026-10-01&to=2026-10-31&q=cafe&recordDetail=abc",
  );
  assert.equal(toRecordSheetHref("/records/abc", "/places/place-1"), "/places/place-1?recordDetail=abc");
});

test("알림 출처는 날짜 필터와 구분하고 댓글 위치를 유지한다", () => {
  assert.equal(
    toRecordSheetHref("/records/abc?from=notification#comment-1", "/notifications"),
    "/notifications?recordDetail=abc&recordFrom=notification#comment-1",
  );
  assert.equal(
    toRecordSheetHref("/records/abc", "/records?recordDetail=old&recordFrom=notification"),
    "/records?recordDetail=abc",
  );
});

test("수정 화면에서 상세로 복귀하면 기록 목록 위에서 열고 작성·외부 주소는 처리하지 않는다", () => {
  assert.equal(toRecordSheetHref("/records/abc", "/records/abc/edit"), "/records?recordDetail=abc");
  assert.equal(toRecordSheetHref("/records/new", "/records"), null);
  assert.equal(toRecordSheetHref("/records/abc/edit", "/records"), null);
  assert.equal(toRecordSheetHref("https://example.com/records/abc", "/records"), null);
});

const createHistory = (href, state = null) => {
  const entries = [{ href, state }];
  let index = 0;
  return {
    get href() {
      return entries[index].href;
    },
    get state() {
      return entries[index].state;
    },
    pushState(state, _unused, href) {
      entries.splice(++index, entries.length, { href, state });
    },
    replaceState(state, _unused, href) {
      entries[index] = { href, state };
    },
    back() {
      index = Math.max(0, index - 1);
    },
    forward() {
      index = Math.min(entries.length - 1, index + 1);
    },
  };
};

test("앱에서 연 시트를 닫으면 같은 목록 항목을 추가하지 않고 이전 방문 기록으로 돌아간다", () => {
  const history = createHistory("/");
  history.pushState({ listState: true }, "", "/records?q=cafe");
  openRecordSheet(history, "/records?q=cafe&recordDetail=abc");
  closeRecordSheet(history, "abc", "/records?q=cafe");
  assert.equal(history.href, "/records?q=cafe");
  history.back();
  assert.equal(history.href, "/");
  history.forward();
  history.forward();
  assert.equal(history.href, "/records?q=cafe&recordDetail=abc");
});

test("외부 링크와 새 탭에서 연 시트는 앱 밖으로 돌아가지 않고 목록에 머문다", () => {
  const history = createHistory("https://example.com");
  history.pushState({ internal: true }, "", "/records?recordDetail=abc");
  closeRecordSheet(history, "abc", "/records");
  assert.equal(history.href, "/records");
  assert.equal(history.state, null);
});

test("다른 기록의 표식만 있는 경우 이전 페이지로 이동하지 않는다", () => {
  const history = createHistory("/records");
  openRecordSheet(history, "/records?recordDetail=abc");
  closeRecordSheet(history, "different", "/records");
  assert.equal(history.href, "/records");
});
