"use client";

import { type KeyboardEvent, useState } from "react";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { placesQueryOptions, type SavedPlaceRow } from "@/entities/place";
import { type CreatePlaceInput, PlaceSearchSaveButton } from "@/features/place/save-place";
import type { KakaoPlace } from "@/shared/api/kakao-local";
import { FOCUS_RING } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/ui/pagination";
import { ResetButton } from "@/shared/ui/reset-button";

import { getSavedKakaoPlaces } from "../model/get-saved-kakao-places";
import { navigatePlaceSearch } from "../model/place-search-navigation";

type PlaceSearchResultsProps = {
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  initialPlaces: SavedPlaceRow[];
  pageableCount: number;
  places: KakaoPlace[];
  query: string;
};

function getSearchPageHref(query: string, page: number) {
  return `/places?${new URLSearchParams({ page: String(page), q: query })}`;
}

export function PlaceSearchResults({
  currentPage,
  hasNextPage,
  hasPreviousPage,
  initialPlaces,
  pageableCount,
  places,
  query,
}: PlaceSearchResultsProps) {
  const router = useRouter();
  const savedPlacesQuery = useQuery({ ...placesQueryOptions, initialData: initialPlaces });
  const [selectedPlaces, setSelectedPlaces] = useState<Map<string, CreatePlaceInput>>(() => new Map());

  const savedKakaoPlaces = getSavedKakaoPlaces(savedPlacesQuery.data ?? []);
  const hasSelectedPlaces = selectedPlaces.size > 0;

  function selectPlace(place: KakaoPlace, savedPlaceId?: string) {
    if (savedPlaceId) return;
    setSelectedPlaces((current) => {
      const next = new Map(current);
      if (next.has(place.id)) {
        next.delete(place.id);
      } else {
        next.set(place.id, { page: currentPage, placeId: place.id, query });
      }
      return next;
    });
  }

  function handlePlaceKeyDown(event: KeyboardEvent<HTMLLIElement>, place: KakaoPlace, savedPlaceId?: string) {
    if (savedPlaceId || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    selectPlace(place, savedPlaceId);
  }

  return (
    <section
      aria-labelledby="place-search-results-title"
      className={cn("flex flex-col gap-3", hasSelectedPlaces && "pb-26")}
    >
      <div className="flex items-start justify-between gap-3 px-1">
        <h2 className="min-w-0 font-bold text-lg" id="place-search-results-title">
          ‘{query}’ 검색 결과 {pageableCount}곳 · {currentPage}페이지
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

      {places.length > 0 ? (
        <ul aria-label="저장할 장소 선택" className="flex flex-col gap-2" role="group">
          {places.map((place) => {
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
                key={place.id}
                onClick={() => selectPlace(place, savedPlaceId)}
                onKeyDown={(event) => handlePlaceKeyDown(event, place, savedPlaceId)}
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

      {hasPreviousPage || hasNextPage ? (
        <Pagination aria-label="장소 검색 결과 페이지">
          <PaginationContent>
            {hasPreviousPage ? (
              <PaginationItem>
                <PaginationPrevious
                  aria-label="이전 검색 결과"
                  href={getSearchPageHref(query, currentPage - 1)}
                  replace
                  text="이전"
                />
              </PaginationItem>
            ) : null}
            <PaginationItem>
              <PaginationLink
                aria-label={`${currentPage}페이지`}
                href={getSearchPageHref(query, currentPage)}
                isActive
                replace
              >
                {currentPage}
              </PaginationLink>
            </PaginationItem>
            {hasNextPage ? (
              <PaginationItem>
                <PaginationNext
                  aria-label="다음 검색 결과"
                  href={getSearchPageHref(query, currentPage + 1)}
                  replace
                  text="다음"
                />
              </PaginationItem>
            ) : null}
          </PaginationContent>
        </Pagination>
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
