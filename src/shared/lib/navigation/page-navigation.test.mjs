import { getPageNavigation } from "@/shared/lib/navigation/page-navigation";

import assert from "node:assert/strict";
import test from "node:test";

function createBrowser() {
  const listeners = new Map();
  const browser = {
    location: { href: "https://example.com/records" },
    addEventListener: (name, listener) => listeners.set(name, listener),
    history: {
      state: { __NA: true, tree: "router state" },
      pushState(state, unused, url) {
        this.state = state;
        if (url != null) browser.location.href = new URL(url, browser.location.href).href;
      },
      replaceState(state, unused, url) {
        this.state = state;
        if (url != null) browser.location.href = new URL(url, browser.location.href).href;
      },
    },
    pop(state, href) {
      browser.history.state = state;
      browser.location.href = href;
      listeners.get("popstate")({ state });
    },
  };
  return browser;
}

test("뒤로/앞으로 이동에서는 등장 효과를 끄고 새 이동에서는 다시 허용한다", () => {
  const browser = createBrowser();
  const navigation = getPageNavigation(browser);
  assert.equal(getPageNavigation(browser), navigation);

  browser.history.pushState({ __NA: true }, "", "/records/one");
  const detailState = browser.history.state;
  assert.equal(navigation.traversal, false);

  browser.history.pushState({ __NA: true }, "", "/records/one/edit");
  browser.pop(detailState, "https://example.com/records/one");
  assert.equal(navigation.traversal, true);

  // Next가 복원 직후 같은 URL의 내부 상태를 갱신해도 뒤로가기 판별은 유지한다.
  browser.history.replaceState({ __NA: true }, "", "/records/one");
  assert.equal(navigation.traversal, true);

  browser.history.pushState({ __NA: true }, "", "/settings");
  assert.equal(navigation.traversal, false);
});

test("push 직전 URL을 보존하고 폼의 같은 URL 보초에는 이어서 전달한다", () => {
  const browser = createBrowser();
  const navigation = getPageNavigation(browser);

  browser.history.pushState({ __NA: true }, "", "/places");
  assert.equal(navigation.previousHref, "https://example.com/records");
  assert.equal(browser.history.state.tree, undefined);

  browser.history.pushState({ leaveGuard: true }, "");
  assert.equal(navigation.previousHref, "https://example.com/records");
  assert.equal(browser.history.state.leaveGuard, true);
});
