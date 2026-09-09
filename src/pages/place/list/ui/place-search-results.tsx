"use client";

import { type KeyboardEvent, useState } from "react";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { placesQueryOptions, type SavedPlaceRow } from "@/entities/place";
import { type PlaceSearchResult, searchPlaces } from "@/entities/place/api/search-places";
import { type CreatePlaceInput, PlaceSearchSaveButton } from "@/features/place/save-place";
import { KAKAO_SEARCH_MAX_PAGE, type KakaoPlace } from "@/shared/api/kakao-local";
import { FOCUS_RING } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { LoadMoreButton } from "@/shared/ui/load-more-button";
import { ResetButton } from "@/shared/ui/reset-button";

import { getSavedKakaoPlaces } from "../model/get-saved-kakao-places";
import { navigatePlaceSearch } from "../model/place-search-navigation";

type PlaceSearchResultsProps = {
  initialPage: PlaceSearchResult;
  initialPlaces: SavedPlaceRow[];
  query: string;
};

export function PlaceSearchResults({ initialPage, initialPlaces, query }: PlaceSearchResultsProps) {
  const router = useRouter();

  const savedPlacesQuery = useQuery({ ...placesQueryOptions, initialData: initialPlaces });
  const resultsQuery = useInfiniteQuery({
    queryKey: ["place-search", query],
    queryFn: ({ pageParam, signal }) => searchPlaces({ page: pageParam, query }, signal),
    initialPageParam: 1,
    initialData: { pageParams: [1], pages: [initialPage] },
    getNextPageParam: (lastPage) =>
      lastPage.isEnd || lastPage.page >= KAKAO_SEARCH_MAX_PAGE ? undefined : lastPage.page + 1,
  });

  const [selectedPlaces, setSelectedPlaces] = useState<Map<string, CreatePlaceInput>>(() => new Map());

  const savedKakaoPlaces = getSavedKakaoPlaces(savedPlacesQuery.data ?? []);
  const results = resultsQuery.data.pages.flatMap(({ page, places }) => places.map((place) => ({ page, place })));
  const hasSelectedPlaces = selectedPlaces.size > 0;

  function selectPlace(place: KakaoPlace, page: number, savedPlaceId?: string) {
    if (savedPlaceId) return;
    setSelectedPlaces((current) => {
      const next = new Map(current);
      if (next.has(place.id)) {
        next.delete(place.id);
      } else {
        next.set(place.id, { page, placeId: place.id, query });
      }
      return next;
    });
  }

  function handlePlaceKeyDown(
    event: KeyboardEvent<HTMLLIElement>,
    place: KakaoPlace,
    page: number,
    savedPlaceId?: string,
  ) {
    if (savedPlaceId || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    selectPlace(place, page, savedPlaceId);
  }

  return (
    <section
      aria-labelledby="place-search-results-title"
      className={cn("flex flex-col gap-3", hasSelectedPlaces && "pb-26")}
    >
      <div className="flex items-start justify-between gap-3 px-1">
        <h2 className="min-w-0 font-bold text-lg" id="place-search-results-title">
          ‘{query}’ 검색 결과 {initialPage.pageableCount}곳
        </h2>
        <ResetButton
          aria-label="장소 검색 초기화"
          className="mt-0.5"
          onReset={() => {
            setSelectedPlaces(new Map());
            navigatePlaceSearch(window, router, "");
          }}
        />
      </div>

      {results.length > 0 ? (
        <ul aria-label="저장할 장소 선택" className="flex flex-col gap-2" role="group">
          {results.map(({ page, place }) => {
            const savedPlaceId = savedKakaoPlaces.get(place.id);
            const selected = selectedPlaces.has(place.id);

            return (
              <li
                aria-checked={selected}
                aria-disabled={Boolean(savedPlaceId)}
                className={cn(
                  "rounded-xl transition-transform duration-200 active:scale-[0.99]",
                  FOCUS_RING,
                  savedPlaceId ? "cursor-default" : "cursor-pointer",
                )}
                key={`${page}:${place.id}`}
                onClick={() => selectPlace(place, page, savedPlaceId)}
                onKeyDown={(event) => handlePlaceKeyDown(event, place, page, savedPlaceId)}
                role="checkbox"
                tabIndex={savedPlaceId ? -1 : 0}
              >
                <Card
                  className={cn(
                    "transition-[background-color,box-shadow] duration-200",
                    selected && "bg-secondary ring-2 ring-primary/40 dark:bg-pressed dark:ring-foreground/15",
                  )}
                  data-selected={selected}
                  size="sm"
                >
                  <CardHeader>
                    <CardTitle className="min-w-0 truncate">{place.name}</CardTitle>
                    <CardDescription>Kakao 장소 검색 결과</CardDescription>
                    <CardAction>
                      {savedPlaceId ? (
                        <Badge>저장됨</Badge>
                      ) : (
                        <Checkbox
                          aria-hidden="true"
                          checked={selected}
                          className="pointer-events-none size-6"
                          tabIndex={-1}
                          variant="circle"
                        />
                      )}
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{place.address ?? "주소 정보 없음"}</p>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty className="border bg-card py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MagnifyingGlassIcon strokeWidth={2} aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>검색 결과가 없어요</EmptyTitle>
            <EmptyDescription>지역명이나 장소 이름을 바꿔 다시 검색해 보세요.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {resultsQuery.hasNextPage ? (
        <LoadMoreButton
          error={resultsQuery.isFetchNextPageError ? "검색 결과를 더 불러오지 못했어요." : undefined}
          loading={resultsQuery.isFetchingNextPage}
          onClick={() => resultsQuery.fetchNextPage()}
        />
      ) : null}

      {hasSelectedPlaces ? (
        <div className="fixed inset-x-0 bottom-(--nav-clearance) z-10 mx-auto w-full max-w-(--app-width) px-4">
          <div className="rounded-xl border border-border bg-background/95 p-2 shadow-lg backdrop-blur-sm">
            <p className="px-2 pb-2 font-medium text-muted-foreground text-sm">
              장소 {selectedPlaces.size}곳을 선택했어요
            </p>
            <PlaceSearchSaveButton
              onSaved={(savedPlaceIds) =>
                setSelectedPlaces((current) => {
                  const next = new Map(current);
                  for (const placeId of savedPlaceIds) next.delete(placeId);
                  return next;
                })
              }
              selections={[...selectedPlaces.values()].map(({ page, placeId, query }) => ({ page, placeId, query }))}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
