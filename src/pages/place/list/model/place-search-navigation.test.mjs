import { navigatePlaceSearch } from "@/pages/place/list/model/place-search-navigation";
import { getPageNavigation } from "@/shared/lib/navigation/page-navigation";

import assert from "node:assert/strict";
import test from "node:test";

function setup(initialPath = "/places") {
  const listeners = new Map();
  const stack = [{ href: `http://example.com${initialPath}`, state: {} }];
  let index = 0;
  const browser = {
    location: { href: stack[0].href },
    addEventListener: (name, listener) => listeners.set(name, listener),
    history: {
      get state() {
        return stack[index].state;
      },
      pushState(state, unused, href) {
        stack.splice(index + 1);
        stack.push({ state, href: new URL(href, browser.location.href).href });
        browser.location.href = stack[++index].href;
      },
      replaceState(state, unused, href) {
        stack[index] = {
          state,
          href: href == null ? browser.location.href : new URL(href, browser.location.href).href,
        };
        browser.location.href = stack[index].href;
      },
    },
  };
  const router = {
    push: (href) => browser.history.pushState({}, "", href),
    replace: (href) => browser.history.replaceState({}, "", href),
    back() {
      assert.ok(index > 0, "직접 진입한 검색에서는 앱 밖으로 뒤로가면 안 된다");
      browser.location.href = stack[--index].href;
      listeners.get("popstate")({ state: stack[index].state });
    },
  };
  getPageNavigation(browser);
  return { browser, router, stack, search: (keyword) => navigatePlaceSearch(browser, router, keyword) };
}

test("검색 변경과 페이지 이동은 한 항목이고 상세 뒤로가기는 마지막 검색 위치로 돌아온다", () => {
  const { browser, router, stack, search } = setup();
  search("카페");
  search("공원");
  router.replace("/places?q=공원&page=2");
  assert.equal(stack.length, 2);
  const searchHref = browser.location.href;
  router.push("/places/place-id");
  router.back();
  assert.equal(browser.location.href, searchHref);
  router.back();
  assert.equal(browser.location.href, "http://example.com/places");
});

test("검색 지우기 후 다시 검색해도 목록과 검색 항목이 중복되지 않는다", () => {
  const { browser, router, stack, search } = setup();
  search("카페");
  search("");
  assert.equal(browser.location.href, "http://example.com/places");
  search("공원");
  assert.equal(stack.length, 2);
  router.back();
  assert.equal(browser.location.href, "http://example.com/places");
  search("   ");
  assert.equal(browser.location.href, "http://example.com/places");
});

test("검색 URL 직접 진입의 초기화는 외부 뒤로가기 대신 목록으로 교체한다", () => {
  const { browser, stack, search } = setup("/places?q=카페");
  search("공원");
  search("");
  assert.equal(stack.length, 1);
  assert.equal(browser.location.href, "http://example.com/places");
});
