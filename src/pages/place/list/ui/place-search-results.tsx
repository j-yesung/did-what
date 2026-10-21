"use client";

import { useState } from "react";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { placeSearchInfiniteQueryOptions, placesQueryOptions, type SavedPlaceRow } from "@/entities/place";
import { type CreatePlaceInput, PlaceSearchSaveButton } from "@/features/place/save-place";
import type { KakaoPlace } from "@/shared/api/kakao-local";
import { Badge } from "@/shared/ui/badge";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Checkbox } from "@/shared/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { ListRow, ListRowTexts } from "@/shared/ui/list-row";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { LoadMoreButton } from "@/shared/ui/load-more-button";
import { ResetButton } from "@/shared/ui/reset-button";
import { Spinner } from "@/shared/ui/spinner";

import { getSavedKakaoPlaces } from "../model/get-saved-kakao-places";

type PlaceSearchResultsProps = {
  onReset: () => void;
  initialPlaces: SavedPlaceRow[];
  query: string;
};

export function PlaceSearchResults({ onReset, initialPlaces, query }: PlaceSearchResultsProps) {
  const savedPlacesQuery = useQuery({ ...placesQueryOptions, initialData: initialPlaces });
  const resultsQuery = useInfiniteQuery(placeSearchInfiniteQueryOptions({ query }));

  const [selectedPlaces, setSelectedPlaces] = useState<Map<string, CreatePlaceInput>>(() => new Map());

  const savedKakaoPlaces = getSavedKakaoPlaces(savedPlacesQuery.data ?? []);
  const results = (resultsQuery.data?.pages ?? []).flatMap(({ page, places }) =>
    places.map((place) => ({ page, place })),
  );
  const hasSelectedPlaces = selectedPlaces.size > 0;

  const selectPlace = (place: KakaoPlace, page: number, savedPlaceId?: string) => {
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
  };

  return (
    <>
      <section
        aria-labelledby="place-search-results-title"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-5 pb-4"
      >
        <div className="flex items-start justify-between gap-3 px-1">
          <h2 className="min-w-0 font-bold text-lg" id="place-search-results-title">
            ‘{query}’ 검색 결과 {resultsQuery.data?.pages[0]?.pageableCount ?? 0}곳
          </h2>
          <ResetButton
            aria-label="장소 검색 초기화"
            className="mt-0.5"
            onReset={() => {
              setSelectedPlaces(new Map());
              onReset();
            }}
          />
        </div>

        {resultsQuery.isPending ? (
          <div aria-label="장소 검색 중" className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : resultsQuery.isError && !resultsQuery.data ? (
          <LoadErrorAlert
            title="장소를 검색하지 못했어요"
            onRetry={() => void resultsQuery.refetch()}
            retrying={resultsQuery.isFetching}
          />
        ) : results.length > 0 ? (
          <div className="flex flex-col">
            <ul aria-label="저장할 장소 선택" className="flex flex-col divide-y" role="group">
              {results.map(({ page, place }) => {
                const savedPlaceId = savedKakaoPlaces.get(place.id);
                const selected = selectedPlaces.has(place.id);

                return (
                  <li key={`${page}:${place.id}`}>
                    <ListRow
                      aria-disabled={Boolean(savedPlaceId)}
                      aria-label={`${place.name}, ${savedPlaceId ? "저장됨" : selected ? "선택됨" : "선택 안 됨"}`}
                      aria-pressed={savedPlaceId ? undefined : selected}
                      className="px-1 py-3"
                      onClick={() => selectPlace(place, page, savedPlaceId)}
                      right={
                        savedPlaceId ? (
                          <Badge>저장됨</Badge>
                        ) : (
                          <Checkbox
                            aria-hidden="true"
                            checked={selected}
                            className="pointer-events-none size-6"
                            tabIndex={-1}
                            variant="circle"
                          />
                        )
                      }
                      type="button"
                    >
                      <ListRowTexts
                        className="[&>span:first-child]:font-bold"
                        description={place.address ?? "주소 정보 없음"}
                        title={place.name}
                      />
                    </ListRow>
                  </li>
                );
              })}
            </ul>
            <p className="px-1 pt-2 text-muted-foreground text-xs">Kakao 장소 검색</p>
          </div>
        ) : (
          <Empty className="flex-1 border-0 py-10">
            <EmptyHeader className="gap-1">
              <EmptyTitle className="font-semibold text-base">검색 결과가 없어요</EmptyTitle>
              <EmptyDescription className="text-sm/normal">지역명이나 장소 이름을 바꿔 보세요.</EmptyDescription>
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
      </section>
      {hasSelectedPlaces ? (
        <BottomSheet.Footer>
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
        </BottomSheet.Footer>
      ) : null}
    </>
  );
}
