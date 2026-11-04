import { applyRecordSearch, clearRecordSearch } from "./record-search.ts";
import assert from "node:assert/strict";
import test from "node:test";

const createHistory = (href, state = null) => {
  const entries = [{ href, state }];
  let index = 0;
  return {
    get href() {
      return entries[index].href;
    },
    get length() {
      return entries.length;
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
  };
};

test("검색을 닫으면 검색 전 항목으로 돌아가고 방문 기록을 늘리지 않는다", () => {
  const history = createHistory("/records?view=calendar");
  applyRecordSearch(history, "view=calendar", "카페");
  assert.equal(history.href, "/records?view=calendar&q=%EC%B9%B4%ED%8E%98");
  clearRecordSearch(history, "view=calendar&q=%EC%B9%B4%ED%8E%98");
  assert.equal(history.href, "/records?view=calendar");
  assert.equal(history.length, 2);
});

test("검색어를 바꾸면 항목을 새로 쌓지 않아 닫을 때 한 번에 검색 전으로 돌아간다", () => {
  const history = createHistory("/records");
  applyRecordSearch(history, "", "카페");
  applyRecordSearch(history, "q=%EC%B9%B4%ED%8E%98", "바다");
  assert.equal(history.href, "/records?q=%EB%B0%94%EB%8B%A4");
  clearRecordSearch(history, "q=%EB%B0%94%EB%8B%A4");
  assert.equal(history.href, "/records");
});

test("주소로 바로 들어온 검색은 이전 페이지로 나가지 않고 검색어만 지운다", () => {
  const history = createHistory("/records?view=calendar&q=%EC%B9%B4%ED%8E%98");
  clearRecordSearch(history, "view=calendar&q=%EC%B9%B4%ED%8E%98");
  assert.equal(history.href, "/records?view=calendar");
  assert.equal(history.state, null);
});
