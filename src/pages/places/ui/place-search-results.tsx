"use client";

import { SearchIcon } from "lucide-react";

import { CreatePlaceForm } from "@/features/manage-place";
import type { KakaoPlace } from "@/shared/api/kakao-local";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/ui/pagination";

type PlaceSearchResultsProps = {
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageableCount: number;
  places: KakaoPlace[];
  query: string;
  savedKakaoIds: Set<string>;
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
  savedKakaoIds,
}: PlaceSearchResultsProps) {
  return (
    <section aria-labelledby="place-search-results-title" className="flex flex-col gap-3">
      <div className="px-1">
        <h2 className="mt-1 font-bold font-heading text-lg" id="place-search-results-title">
          ‘{query}’ 검색 결과 {pageableCount}곳 · {currentPage}페이지
        </h2>
      </div>

      {places.length > 0 ? (
        places.map((place) => (
          <Card key={place.id} size="sm">
            <CardHeader>
              <CardTitle>{place.name}</CardTitle>
              <CardDescription>Kakao 장소 검색 결과</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{place.address ?? "주소 정보 없음"}</p>
            </CardContent>
            <CardFooter>
              <CreatePlaceForm
                page={currentPage}
                placeId={place.id}
                query={query}
                saved={savedKakaoIds.has(place.id)}
              />
            </CardFooter>
          </Card>
        ))
      ) : (
        <Empty className="border bg-card py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon aria-hidden="true" />
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
