import { getPageNavigation } from "@/shared/lib/navigation/page-navigation";

type SearchRouter = {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
};

export const navigatePlaceSearch = (browser: Window, router: SearchRouter, keyword: string) => {
  const url = new URL(browser.location.href);
  const searching = url.searchParams.has("q");
  const query = keyword.trim();

  if (!query) {
    if (!searching) return;
    // 목록에서 시작한 검색만 한 칸 돌아간다. 검색 URL로 직접 들어왔으면 목록으로 교체한다.
    if (getPageNavigation(browser).previousHref === new URL("/places", url).href) router.back();
    else router.replace("/places");
    return;
  }

  const href = `/places?${new URLSearchParams({ q: query })}`;
  if (searching) router.replace(href);
  else router.push(href);
};
