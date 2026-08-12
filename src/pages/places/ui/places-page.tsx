import { redirect } from "next/navigation";

import { getPlaces } from "@/entities/place";
import {
  KAKAO_SEARCH_MAX_PAGE,
  normalizeKakaoPage,
  searchKakaoPlaces,
  validateKakaoQuery,
} from "@/shared/api/kakao-local";
import { createClient } from "@/shared/api/supabase/server";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

import { PlaceSearchForm } from "./place-search-form";
import { PlaceSearchResults } from "./place-search-results";
import { SavedPlaceList } from "./saved-place-list";

type PlacesPageProps = {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[] }>;
};

export async function PlacesPage({ searchParams }: PlacesPageProps) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const hasSearch = Object.hasOwn(params, "q");
  const rawQuery = typeof params.q === "string" ? params.q : "";
  const currentPage = normalizeKakaoPage(typeof params.page === "string" ? params.page : undefined);
  const queryResult = hasSearch ? validateKakaoQuery(rawQuery) : null;
  const query = queryResult?.valid ? queryResult.query : rawQuery;
  const [placesResult, searchResult] = await Promise.all([
    getPlaces(userData.user.id),
    queryResult?.valid ? searchKakaoPlaces(queryResult.query, currentPage) : Promise.resolve(null),
  ]);
  const places = placesResult.data ?? [];
  const successfulSearchResult = searchResult && "isEnd" in searchResult ? searchResult : null;
  const searchError =
    queryResult && !queryResult.valid
      ? queryResult.error
      : searchResult && "error" in searchResult
        ? searchResult.error
        : undefined;
  const savedKakaoIds = new Set(
    places.flatMap((place) => (place.provider === "kakao" && place.provider_place_id ? [place.provider_place_id] : [])),
  );

  return (
    <PageShell className="[background:radial-gradient(circle_at_88%_0%,color-mix(in_srgb,var(--brand-100),transparent_30%),transparent_28%),var(--background)]">
      <PageHeader back="/" eyebrow="PLACE ARCHIVE" title="장소" />

      <section aria-labelledby="places-intro-title" className="px-1">
        <p className="font-bold text-primary text-xs">{places.length}곳에 추억 저장 중</p>
        <h2 className="mt-2 font-bold font-heading text-2xl tracking-[-0.04em]" id="places-intro-title">
          기억하고 싶은 장소를 찾아보세요.
        </h2>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
          저장한 장소는 새 기록을 남길 때 바로 선택할 수 있어요.
        </p>
      </section>

      <PlaceSearchForm query={query} searchError={searchError} />

      {queryResult?.valid && !searchError ? (
        <PlaceSearchResults
          currentPage={currentPage}
          hasNextPage={Boolean(
            successfulSearchResult && !successfulSearchResult.isEnd && currentPage < KAKAO_SEARCH_MAX_PAGE,
          )}
          hasPreviousPage={currentPage > 1}
          pageableCount={successfulSearchResult?.pageableCount ?? 0}
          places={successfulSearchResult?.places ?? []}
          query={queryResult.query}
          savedKakaoIds={savedKakaoIds}
        />
      ) : null}

      <SavedPlaceList hasError={Boolean(placesResult.error)} places={places} />
    </PageShell>
  );
}
