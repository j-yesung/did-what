"use client";

import { MapPinIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { getPlaceRegionLabel, placesQueryOptions } from "@/entities/place";
import { Badge } from "@/shared/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { ListRow, ListRowTexts } from "@/shared/ui/list-row";
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
  const router = useRouter();
  const placesQuery = useQuery(placesQueryOptions);

  if (placesQuery.isPending) {
    return (
      <div className="fixed inset-0 grid place-items-center">
        <Spinner
          aria-label="저장한 장소를 불러오는 중"
          className="motion-safe:fade-in text-muted-foreground motion-safe:animate-in motion-safe:fill-mode-both motion-safe:delay-300"
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
      <div className="flex flex-col gap-2.5 overflow-hidden">
        {places.map((place) => (
          <ListRow
            key={place.id}
            aria-label={`${place.name} 상세 보기`}
            onClick={() => router.push(`/places/${place.id}`)}
            right={
              (place.record_places[0]?.count ?? 0) > 0 ? (
                <Badge
                  aria-label={`기록 ${place.record_places[0]?.count}개`}
                  className="min-h-6 min-w-6 justify-center rounded-full bg-primary px-1.5 py-1 text-primary-foreground text-xs"
                  tone="primary"
                >
                  {place.record_places[0]?.count}
                </Badge>
              ) : null
            }
            type="button"
          >
            <ListRowTexts description={`${getPlaceRegionLabel(place.region_name, place.address)}`} title={place.name} />
          </ListRow>
        ))}
      </div>
    </section>
  );
}
