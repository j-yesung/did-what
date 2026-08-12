import { ChevronLeftIcon, CircleAlertIcon, MapPinIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getPlaces } from "@/entities/place";
import { CreatePlaceForm } from "@/features/create-place";
import {
  KAKAO_SEARCH_MAX_PAGE,
  normalizeKakaoPage,
  searchKakaoPlaces,
  validateKakaoQuery,
} from "@/shared/api/kakao-local";
import { createClient } from "@/shared/api/supabase/server";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/ui/pagination";

const DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Seoul",
  year: "numeric",
});

type PlacesPageProps = {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[] }>;
};

function getSearchPageHref(query: string, page: number) {
  return `/places?${new URLSearchParams({ page: String(page), q: query })}`;
}

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
  const searchPlaces = successfulSearchResult?.places ?? [];
  const searchError =
    queryResult && !queryResult.valid
      ? queryResult.error
      : searchResult && "error" in searchResult
        ? searchResult.error
        : undefined;
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = Boolean(
    successfulSearchResult && !successfulSearchResult.isEnd && currentPage < KAKAO_SEARCH_MAX_PAGE,
  );
  const savedKakaoIds = new Set(
    places.flatMap((place) => (place.provider === "kakao" && place.provider_place_id ? [place.provider_place_id] : [])),
  );

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-5 bg-background px-5 py-6 [background:radial-gradient(circle_at_88%_0%,color-mix(in_srgb,var(--brand-100),transparent_30%),transparent_28%),var(--background)]">
      <header className="grid grid-cols-[40px_1fr_40px] items-center">
        <Button
          aria-label="홈으로 돌아가기"
          nativeButton={false}
          render={<Link href="/" />}
          size="icon-lg"
          variant="ghost"
        >
          <ChevronLeftIcon aria-hidden="true" />
        </Button>
        <div className="text-center">
          <p className="font-bold text-[9px] text-primary tracking-[0.16em]">PLACE ARCHIVE</p>
          <h1 className="font-bold font-heading text-xl tracking-[-0.03em]">장소</h1>
        </div>
      </header>

      <section aria-labelledby="places-intro-title" className="px-1">
        <p className="font-bold text-primary text-xs">{places.length}곳에 추억 저장 중</p>
        <h2 className="mt-2 font-bold font-heading text-2xl tracking-[-0.04em]" id="places-intro-title">
          기억하고 싶은 장소를 찾아보세요.
        </h2>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
          저장한 장소는 새 기록을 남길 때 바로 선택할 수 있어요.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>장소 검색</CardTitle>
          <CardDescription>상호명이나 지역을 함께 입력하면 더 정확하게 찾을 수 있어요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="place-search-form" method="get">
            <FieldGroup>
              <Field data-invalid={Boolean(searchError)}>
                <FieldLabel htmlFor="place-query">어디였나요?</FieldLabel>
                <Input
                  aria-describedby={searchError ? "place-query-error" : undefined}
                  aria-invalid={Boolean(searchError)}
                  autoComplete="off"
                  defaultValue={query}
                  id="place-query"
                  key={query}
                  maxLength={100}
                  name="q"
                  placeholder="예: 성수 카페"
                  required
                  type="search"
                />
                <FieldError id="place-query-error">{searchError}</FieldError>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Button className="w-full" form="place-search-form" type="submit">
            <SearchIcon data-icon="inline-start" />
            검색
          </Button>
        </CardFooter>
      </Card>

      {queryResult?.valid && !searchError ? (
        <section aria-labelledby="place-search-results-title" className="flex flex-col gap-3">
          <div className="px-1">
            <p className="font-bold text-primary text-xs">SEARCH RESULT</p>
            <h2 className="mt-1 font-bold font-heading text-lg" id="place-search-results-title">
              ‘{queryResult.query}’ 검색 결과 {successfulSearchResult?.pageableCount ?? 0}곳 · {currentPage}페이지
            </h2>
          </div>
          {searchPlaces.length > 0 ? (
            searchPlaces.map((place) => (
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
                    query={queryResult.query}
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
                      href={getSearchPageHref(queryResult.query, currentPage - 1)}
                      text="이전"
                    />
                  </PaginationItem>
                ) : null}
                <PaginationItem>
                  <PaginationLink
                    aria-label={`${currentPage}페이지`}
                    href={getSearchPageHref(queryResult.query, currentPage)}
                    isActive
                  >
                    {currentPage}
                  </PaginationLink>
                </PaginationItem>
                {hasNextPage ? (
                  <PaginationItem>
                    <PaginationNext
                      aria-label="다음 검색 결과"
                      href={getSearchPageHref(queryResult.query, currentPage + 1)}
                      text="다음"
                    />
                  </PaginationItem>
                ) : null}
              </PaginationContent>
            </Pagination>
          ) : null}
        </section>
      ) : null}

      {placesResult.error ? (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>저장한 장소를 불러오지 못했어요</AlertTitle>
          <AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription>
        </Alert>
      ) : places.length > 0 ? (
        <section aria-label={`저장한 장소 ${places.length}곳`} className="flex flex-col gap-3">
          <div className="px-1">
            <p className="font-bold text-primary text-xs">MY PLACES</p>
            <h2 className="mt-1 font-bold font-heading text-lg">저장한 장소</h2>
          </div>
          {places.map((place) => (
            <Card key={place.id} size="sm">
              <CardHeader>
                <CardTitle>{place.name}</CardTitle>
                <CardDescription>기록에 연결할 수 있는 장소</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{place.address ?? "주소 정보 없음"}</p>
              </CardContent>
              <CardFooter>
                <p className="text-muted-foreground text-xs">
                  {DATE_FORMATTER.format(new Date(place.created_at))} 저장
                </p>
              </CardFooter>
            </Card>
          ))}
        </section>
      ) : (
        <Empty className="border bg-card py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MapPinIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>아직 저장한 장소가 없어요</EmptyTitle>
            <EmptyDescription>위 검색란에서 첫 번째 추억의 장소를 찾아 저장해 보세요.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </main>
  );
}
