"use client";

import { MapPinIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { placesQueryOptions } from "@/entities/place/api/places-query";
import { DeletePlaceButton } from "@/features/manage-place";
import { formatShortDate } from "@/shared/lib/date/format-date";
import { FOCUS_RING, PRESS_FEEDBACK_LARGE, PRESS_SURFACE } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { Spinner } from "@/shared/ui/spinner";

export function SavedPlaceCount() {
  const places = useQuery(placesQueryOptions);

  return (
    <p className="font-bold text-foreground text-xs">
      {places.isPending ? "저장한 장소를 불러오는 중" : `${places.data?.length ?? 0}곳에 추억 저장 중`}
    </p>
  );
}

export function SavedPlaceList() {
  const placesQuery = useQuery(placesQueryOptions);

  if (placesQuery.isPending) {
    return (
      <div className="grid min-h-40 place-items-center">
        <Spinner
          aria-label="저장한 장소를 불러오는 중"
          className="motion-safe:fade-in size-6 text-muted-foreground motion-safe:animate-in motion-safe:fill-mode-both motion-safe:delay-300"
        />
      </div>
    );
  }

  if (placesQuery.isError) {
    return <LoadErrorAlert title="저장한 장소를 불러오지 못했어요" />;
  }

  const places = placesQuery.data;

  if (places.length === 0) {
    return (
      <Empty className="border bg-card py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPinIcon strokeWidth={2} aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>아직 저장한 장소가 없어요</EmptyTitle>
          <EmptyDescription>위 검색란에서 첫 번째 추억의 장소를 찾아 저장해 보세요.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <section aria-label={`저장한 장소 ${places.length}곳`} className="flex flex-col gap-3">
      <div className="px-1">
        <h2 className="mt-1 font-bold text-lg">저장한 장소</h2>
      </div>
      {places.map((place) => (
        <Card className={cn("relative", PRESS_FEEDBACK_LARGE, PRESS_SURFACE)} data-press="" key={place.id} size="sm">
          <CardHeader>
            <CardTitle>{place.name}</CardTitle>
            <CardDescription>
              {place.saved_at ? `${formatShortDate(place.saved_at)} 저장` : "저장한 장소"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{place.address ?? "주소 정보 없음"}</p>
          </CardContent>
          <CardFooter className="py-0">
            <div className="relative z-10">
              <DeletePlaceButton
                iconOnly
                name={place.name}
                placeId={place.id}
                recordCount={place.record_places[0]?.count ?? 0}
              />
            </div>
          </CardFooter>
          <Link
            aria-label={`${place.name} 상세 보기`}
            className={cn("absolute inset-0 rounded-xl", FOCUS_RING)}
            href={`/places/${place.id}`}
          />
        </Card>
      ))}
    </section>
  );
}
