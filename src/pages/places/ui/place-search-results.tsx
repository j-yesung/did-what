"use client";

import { ArrowCounterClockwiseIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { placesQueryOptions } from "@/entities/place/api/places-query";
import { PlaceSearchSaveToggle } from "@/features/manage-place";
import type { KakaoPlace } from "@/shared/api/kakao-local";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { IconButton } from "@/shared/ui/icon-button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/ui/pagination";
import { Spinner } from "@/shared/ui/spinner";

import { getSavedKakaoPlaces } from "../model/get-saved-kakao-places";

type PlaceSearchResultsProps = {
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
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
  pageableCount,
  places,
  query,
}: PlaceSearchResultsProps) {
  const router = useRouter();
  const savedPlacesQuery = useQuery(placesQueryOptions);

  if (savedPlacesQuery.isPending) {
    return (
      <div className="grid min-h-40 place-items-center">
        <Spinner
          aria-label="저장한 장소를 확인하는 중"
          className="motion-safe:fade-in size-6 text-muted-foreground motion-safe:animate-in motion-safe:fill-mode-both motion-safe:delay-300"
        />
      </div>
    );
  }

  const savedKakaoPlaces = getSavedKakaoPlaces(savedPlacesQuery.data ?? []);

  return (
    <section aria-labelledby="place-search-results-title" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3 px-1">
        <h2 className="min-w-0 font-bold text-lg" id="place-search-results-title">
          ‘{query}’ 검색 결과 {pageableCount}곳 · {currentPage}페이지
        </h2>
        <IconButton
          aria-label="장소 검색 초기화"
          className="mt-0.5"
          icon={ArrowCounterClockwiseIcon}
          iconStrokeWidth={3}
          onClick={() => router.replace("/places")}
          size="sm"
          type="button"
        />
      </div>

      {places.length > 0 ? (
        places.map((place) => {
          const savedPlaceId = savedKakaoPlaces.get(place.id);

          return (
            <Card key={place.id} size="sm">
              <CardHeader>
                <CardTitle className="min-w-0 truncate">{place.name}</CardTitle>
                <CardDescription>Kakao 장소 검색 결과</CardDescription>
                <CardAction>
                  <PlaceSearchSaveToggle
                    page={currentPage}
                    placeId={place.id}
                    query={query}
                    savedPlaceId={savedPlaceId}
                  />
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{place.address ?? "주소 정보 없음"}</p>
              </CardContent>
            </Card>
          );
        })
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
                  text="이전"
                />
              </PaginationItem>
            ) : null}
            <PaginationItem>
              <PaginationLink aria-label={`${currentPage}페이지`} href={getSearchPageHref(query, currentPage)} isActive>
                {currentPage}
              </PaginationLink>
            </PaginationItem>
            {hasNextPage ? (
              <PaginationItem>
                <PaginationNext
                  aria-label="다음 검색 결과"
                  href={getSearchPageHref(query, currentPage + 1)}
                  text="다음"
                />
              </PaginationItem>
            ) : null}
          </PaginationContent>
        </Pagination>
      ) : null}
    </section>
  );
}
