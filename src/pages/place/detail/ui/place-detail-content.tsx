"use client";

import { CalendarDotsIcon, MapPinAreaIcon, MapPinIcon, NotePencilIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { placeQueryOptions, placeRecordsQueryOptions, placesQueryOptions } from "@/entities/place";
import { EmptyRecords, RecordCard, RecordTimeline, RecordTimelineSkeleton } from "@/entities/record";
import { DeletePlaceButton } from "@/features/place/delete-place";
import { formatDate } from "@/shared/lib/date/format-date";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { OverscrollBack } from "@/shared/ui/overscroll-back";
import { Skeleton } from "@/shared/ui/skeleton";

type PlaceDetailContentProps = {
  placeId: string;
};

export function PlaceDetailContent({ placeId }: PlaceDetailContentProps) {
  const placesQuery = useQuery(placesQueryOptions);
  const cachedPlace = placesQuery.data?.find(({ id }) => id === placeId);
  const placeQuery = useQuery({
    ...placeQueryOptions(placeId),
    enabled: !cachedPlace && !placesQuery.isPending,
  });
  const place = cachedPlace ?? placeQuery.data;
  const recordsQuery = useQuery(placeRecordsQueryOptions(placeId));
  const records = (recordsQuery.data ?? [])
    .map(({ record }) => record)
    .toSorted((a, b) => b.recorded_at.localeCompare(a.recorded_at));
  const cachedRecordCount = cachedPlace?.record_places[0]?.count ?? 0;
  const recordCount = recordsQuery.data ? records.length : cachedRecordCount;

  return (
    <OverscrollBack fallbackHref="/places">
      <PageShell>
        <PageHeader back="/places" title="기억의 장소" />

        {!place && (placesQuery.isPending || placeQuery.isPending) ? (
          <PlaceDetailSkeleton />
        ) : placeQuery.isError || recordsQuery.isError || !place ? (
          <LoadErrorAlert
            icon={<MapPinIcon strokeWidth={2} aria-hidden="true" />}
            title="장소의 기록을 불러오지 못했어요"
          />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardDescription className="flex items-center gap-1.5 font-bold text-foreground text-xs">
                  <MapPinAreaIcon strokeWidth={2} className="size-4" aria-hidden="true" />
                  기억의 장소
                </CardDescription>
                <CardTitle className="text-xl">{place.name}</CardTitle>
                <CardDescription>{place.address ?? "주소 정보 없음"}</CardDescription>
                <CardAction>
                  <DeletePlaceButton name={place.name} placeId={place.id} recordCount={recordCount} />
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <CalendarDotsIcon strokeWidth={2} className="size-4" aria-hidden="true" />
                  {place.saved_at ? `${formatDate(place.saved_at)}에 저장했어요.` : "방문 기록에 연결된 장소예요."}
                </p>
              </CardContent>
            </Card>

            {recordsQuery.isPending ? (
              <RecordTimelineSkeleton label={`${place.name} 기록을 불러오는 중`} />
            ) : records.length ? (
              <RecordTimeline aria-labelledby="place-records-title">
                <div className="flex items-center justify-between gap-3 px-1">
                  <h2 className="flex items-center gap-2 font-bold" id="place-records-title">
                    <NotePencilIcon strokeWidth={2} className="size-5 text-foreground" aria-hidden="true" />
                    이곳의 기록
                  </h2>
                  <p className="text-muted-foreground text-xs">{records.length}개</p>
                </div>

                {records.map((record, index) => (
                  <RecordCard isLast={index === records.length - 1} key={record.id} record={record} />
                ))}
              </RecordTimeline>
            ) : (
              <EmptyRecords title={`${place.name}에서 남긴 기록이 없어요`} />
            )}
          </>
        )}
      </PageShell>
    </OverscrollBack>
  );
}

function PlaceDetailSkeleton() {
  return (
    <div aria-label="장소를 불러오는 중" aria-live="polite" className="flex flex-col gap-5" role="status">
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-1 h-6 w-40" />
          <Skeleton className="mt-1 h-4 w-52" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-44" />
        </CardContent>
      </Card>
      <RecordTimelineSkeleton label="장소의 기록을 불러오는 중" />
    </div>
  );
}
