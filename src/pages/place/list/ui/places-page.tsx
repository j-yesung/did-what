import { getSavedPlaces } from "@/entities/place/server";
import {
  KAKAO_SEARCH_MAX_PAGE,
  normalizeKakaoPage,
  searchKakaoPlaces,
  validateKakaoQuery,
} from "@/shared/api/kakao-local/server";
import { requireUser } from "@/shared/api/supabase/require-user";
import { PageShell } from "@/shared/ui/layouts";
import { ListHeader } from "@/shared/ui/list-header";

import { PlaceSearchForm } from "./place-search-form";
import { PlaceSearchResults } from "./place-search-results";
import { SavedPlaceList } from "./saved-place-list";

type PlacesPageProps = {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[] }>;
};

export async function PlacesPage({ searchParams }: PlacesPageProps) {
  const [params, { user }] = await Promise.all([searchParams, requireUser()]);
  const hasSearch = Object.hasOwn(params, "q");
  const rawQuery = typeof params.q === "string" ? params.q : "";
  const currentPage = normalizeKakaoPage(typeof params.page === "string" ? params.page : undefined);
  const queryResult = hasSearch ? validateKakaoQuery(rawQuery) : null;
  const query = queryResult?.valid ? queryResult.query : rawQuery;
  const [initialPlaces, searchResult] = await Promise.all([
    getSavedPlaces(user.id),
    queryResult?.valid ? searchKakaoPlaces(queryResult.query, currentPage) : Promise.resolve(null),
  ]);
  const successfulSearchResult = searchResult && "isEnd" in searchResult ? searchResult : null;
  const searchError =
    queryResult && !queryResult.valid
      ? queryResult.error
      : searchResult && "error" in searchResult
        ? searchResult.error
        : undefined;

  return (
    <PageShell withBottomNavigation>
      <ListHeader title="기억하고 싶은 장소" />

      <PlaceSearchForm query={query} searchError={searchError} />

      {hasSearch ? (
        queryResult?.valid && !searchError ? (
          <PlaceSearchResults
            currentPage={currentPage}
            hasNextPage={Boolean(
              successfulSearchResult && !successfulSearchResult.isEnd && currentPage < KAKAO_SEARCH_MAX_PAGE,
            )}
            hasPreviousPage={currentPage > 1}
            initialPlaces={initialPlaces}
            pageableCount={successfulSearchResult?.pageableCount ?? 0}
            places={successfulSearchResult?.places ?? []}
            query={queryResult.query}
          />
        ) : null
      ) : (
        <SavedPlaceList initialPlaces={initialPlaces} />
      )}
    </PageShell>
  );
}
