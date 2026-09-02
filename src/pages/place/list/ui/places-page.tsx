import {
  KAKAO_SEARCH_MAX_PAGE,
  normalizeKakaoPage,
  searchKakaoPlaces,
  validateKakaoQuery,
} from "@/shared/api/kakao-local/server";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

import { PlaceSearchForm } from "./place-search-form";
import { PlaceSearchResults } from "./place-search-results";
import { SavedPlaceCount, SavedPlaceList } from "./saved-place-list";

type PlacesPageProps = {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[] }>;
};

export async function PlacesPage({ searchParams }: PlacesPageProps) {
  const params = await searchParams;
  const hasSearch = Object.hasOwn(params, "q");
  const rawQuery = typeof params.q === "string" ? params.q : "";
  const currentPage = normalizeKakaoPage(typeof params.page === "string" ? params.page : undefined);
  const queryResult = hasSearch ? validateKakaoQuery(rawQuery) : null;
  const query = queryResult?.valid ? queryResult.query : rawQuery;
  const searchResult = queryResult?.valid ? await searchKakaoPlaces(queryResult.query, currentPage) : null;
  const successfulSearchResult = searchResult && "isEnd" in searchResult ? searchResult : null;
  const searchError =
    queryResult && !queryResult.valid
      ? queryResult.error
      : searchResult && "error" in searchResult
        ? searchResult.error
        : undefined;

  return (
    <PageShell className="pb-[calc(var(--nav-clearance)+50px)]" withBottomNavigation>
      <PageHeader title="장소" />

      <section aria-labelledby="places-intro-title" className="px-1">
        <SavedPlaceCount />
        <h2 className="mt-2 font-bold text-2xl tracking-[-0.04em]" id="places-intro-title">
          기억하고 싶은 장소를 찾아보세요.
        </h2>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
          직접 간직하기로 선택한 장소만 이곳에 모여요.
        </p>
      </section>

      <PlaceSearchForm query={query} searchError={searchError} />

      {hasSearch ? (
        queryResult?.valid && !searchError ? (
          <PlaceSearchResults
            currentPage={currentPage}
            hasNextPage={Boolean(
              successfulSearchResult && !successfulSearchResult.isEnd && currentPage < KAKAO_SEARCH_MAX_PAGE,
            )}
            hasPreviousPage={currentPage > 1}
            pageableCount={successfulSearchResult?.pageableCount ?? 0}
            places={successfulSearchResult?.places ?? []}
            query={queryResult.query}
          />
        ) : null
      ) : (
        <SavedPlaceList />
      )}
    </PageShell>
  );
}
