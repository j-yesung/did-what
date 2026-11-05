import { applyRecordSearch, beginRecordSearch, clearRecordSearch, resetRecordSearch } from "./record-search.ts";
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

test("빈 검색도 진입 시 한 항목만 추가하고 지우기와 종료를 구분한다", () => {
  const original = "/records?category=travel&from=2026-01-01&view=calendar";
  const history = createHistory(original, { navigation: "retained" });
  beginRecordSearch(history, original.split("?")[1]);
  beginRecordSearch(history, history.href.split("?")[1]);
  assert.equal(history.length, 2);
  applyRecordSearch(history, history.href.split("?")[1], "카페");
  applyRecordSearch(history, history.href.split("?")[1], "");
  assert.equal(new URL(history.href, "http://app").searchParams.get("search"), "1");
  assert.equal(history.length, 2);
  clearRecordSearch(history, history.href.split("?")[1]);
  assert.equal(history.href, original);
});

test("주소로 들어온 검색의 재검색은 항목을 추가하지 않고 취소하면 검색을 종료한다", () => {
  const history = createHistory("/records?q=카페");
  applyRecordSearch(history, "q=카페", "바다");
  assert.equal(history.length, 1);
  clearRecordSearch(history, "q=바다");
  assert.equal(history.href, "/records");
});

test("주소로 들어온 검색에서도 검색어만 지운 뒤 입력 상태를 유지한다", () => {
  const history = createHistory("/records?q=카페");
  applyRecordSearch(history, "q=카페", "");
  assert.equal(history.href, "/records?search=1");
  applyRecordSearch(history, "search=1", "바다");
  assert.equal(history.length, 1);
  clearRecordSearch(history, "search=1&q=바다");
  assert.equal(history.href, "/records");
});

test("새로고침 초기화는 뒤로 가지 않고 검색만 지워 보기와 필터를 보존한다", () => {
  const history = createHistory("/records?view=calendar&category=travel&search=1&q=부산", {
    didWhatRecordSearch: true,
  });
  resetRecordSearch(history, "view=calendar&category=travel&search=1&q=부산");
  assert.equal(history.href, "/records?view=calendar&category=travel");
  assert.equal(history.length, 1);
  assert.equal(history.state, null);
});
