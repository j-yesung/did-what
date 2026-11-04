import { getRecordViewFromParams } from "./record-view.ts";
import assert from "node:assert/strict";
import test from "node:test";

test("기본 진입과 시트만 열린 주소는 저장한 보기를 사용한다", () => {
  assert.equal(getRecordViewFromParams({}), null);
  assert.equal(getRecordViewFromParams({ recordDetail: "abc", recordFrom: "notification" }), null);
});

test("명시한 보기와 검색 조건은 저장된 보기보다 우선한다", () => {
  assert.equal(getRecordViewFromParams({ view: "calendar", q: "카페", recordDetail: "abc" }), "calendar");
  assert.equal(getRecordViewFromParams({ view: "list" }), "list");
  assert.equal(getRecordViewFromParams({ q: "카페", recordDetail: "abc" }), "list");
  assert.equal(getRecordViewFromParams({ month: "2026-11" }), "list");
});

test("잘못되거나 중복된 보기 값은 목록으로 처리한다", () => {
  assert.equal(getRecordViewFromParams({ view: "unknown" }), "list");
  assert.equal(getRecordViewFromParams({ view: ["calendar", "list"] }), "list");
});
