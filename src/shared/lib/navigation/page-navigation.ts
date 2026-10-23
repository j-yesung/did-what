const navigations = new WeakMap<Window, ReturnType<typeof createPageNavigation>>();

const createPageNavigation = (browser: Window) => {
  const history = browser.history;
  const pushState = history.pushState.bind(history);
  const replaceState = history.replaceState.bind(history);
  let href = browser.location.href;
  let traversal = false;

  history.pushState = (state, unused, url) => {
    pushState(state, unused, url);
    href = browser.location.href;
    traversal = false;
  };

  history.replaceState = (state, unused, url) => {
    const nextHref = url == null ? href : new URL(url, browser.location.href).href;
    replaceState(state, unused, url);
    if (nextHref !== href) traversal = false;
    href = nextHref;
  };

  // 라우터가 화면을 갱신하기 전에 뒤로/앞으로 이동을 기록한다. 기본 스와이프는 가로채지 않는다.
  browser.addEventListener(
    "popstate",
    () => {
      href = browser.location.href;
      traversal = true;
    },
    { capture: true },
  );

  return {
    get traversal() {
      return traversal;
    },
  };
};

/** PageShell과 내부 스크롤 복원이 같은 이동 상태를 공유한다. */
export const getPageNavigation = (browser: Window) => {
  let navigation = navigations.get(browser);
  if (!navigation) {
    navigation = createPageNavigation(browser);
    navigations.set(browser, navigation);
  }
  return navigation;
};
