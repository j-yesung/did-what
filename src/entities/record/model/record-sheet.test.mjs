import { toRecordSheetHref } from "./record-sheet.ts";
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
