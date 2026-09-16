import { requireMember } from "@/entities/member/server";
import { getSavedPlaces } from "@/entities/place/server";
import { searchKakaoPlaces, validateKakaoQuery } from "@/shared/api/kakao-local/server";
import { PageShell } from "@/shared/ui/layouts";
import { ListHeader } from "@/shared/ui/list-header";

import { PlaceSearchForm } from "./place-search-form";
import { PlaceSearchResults } from "./place-search-results";
import { SavedPlaceList } from "./saved-place-list";

type PlacesPageProps = { searchParams: Promise<{ q?: string | string[] }> };

export async function PlacesPage({ searchParams }: PlacesPageProps) {
  const [params, { user }] = await Promise.all([searchParams, requireMember()]);
  const hasSearch = Object.hasOwn(params, "q");
  const rawQuery = typeof params.q === "string" ? params.q : "";
  const queryResult = hasSearch ? validateKakaoQuery(rawQuery) : null;
  const query = queryResult?.valid ? queryResult.query : rawQuery;
  const [initialPlaces, searchResult] = await Promise.all([
    getSavedPlaces(user.id),
    queryResult?.valid ? searchKakaoPlaces(queryResult.query) : Promise.resolve(null),
  ]);
  const successfulSearchResult = searchResult && "isEnd" in searchResult ? searchResult : null;
  const searchError =
    queryResult && !queryResult.valid
      ? queryResult.error
      : searchResult && "error" in searchResult
        ? searchResult.error
        : undefined;

  return (
    <PageShell className="gap-4" withBottomNavigation>
      <ListHeader title="장소" />

      <PlaceSearchForm query={query} searchError={searchError} />

      {hasSearch ? (
        queryResult?.valid && successfulSearchResult ? (
          <PlaceSearchResults
            initialPage={{ ...successfulSearchResult, query: queryResult.query, scope: null }}
            initialPlaces={initialPlaces}
            query={queryResult.query}
          />
        ) : null
      ) : (
        <SavedPlaceList initialPlaces={initialPlaces} />
      )}
    </PageShell>
  );
}
