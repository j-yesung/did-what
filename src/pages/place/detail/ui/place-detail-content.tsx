"use client";

import { Fragment } from "react";

import { MapPinIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { placeQueryOptions, placeRecordsQueryOptions, placesQueryOptions } from "@/entities/place";
import {
  EmptyRecords,
  formatRecordTimelineMonth,
  getRecordTimelineItemState,
  RecordCard,
  RecordCreateButton,
  RecordTimeline,
} from "@/entities/record";
import { recordCommentListQueryOptions } from "@/entities/record-comment";
import { NotePencilRoundedIcon } from "@/shared/assets/icons/note-pencil-rounded";
import { cn } from "@/shared/lib/utils";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { OverscrollBack } from "@/shared/ui/overscroll-back";

type PlaceDetailContentProps = {
  placeId: string;
};

export function PlaceDetailContent({ placeId }: PlaceDetailContentProps) {
  const queryClient = useQueryClient();
  const placesQuery = useQuery(placesQueryOptions);
  const prefetchComments = (recordId: string) =>
    void queryClient.prefetchInfiniteQuery(recordCommentListQueryOptions(recordId));
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
  let monthStartIndex = 0;
  const isPlacePending = !place && !placeQuery.isError && (placesQuery.isPending || placeQuery.isPending);

  return (
    <OverscrollBack fallbackHref="/places">
      <PageShell>
        <PageHeader back="/places" />
        <div className="pointer-events-none fixed inset-x-0 top-0 z-30">
          <div className="mx-auto flex w-full max-w-(--app-width) justify-end px-5 pt-(--page-top)">
            <RecordCreateButton className="pointer-events-auto" href={`/records/new?placeId=${placeId}`} />
          </div>
        </div>

        {isPlacePending ? null : placeQuery.isError || recordsQuery.isError || !place ? (
          <LoadErrorAlert
            icon={<MapPinIcon aria-hidden="true" />}
            onRetry={
              placeQuery.isError || recordsQuery.isError
                ? () => {
                    if (placeQuery.isError) void placeQuery.refetch();
                    if (recordsQuery.isError) void recordsQuery.refetch();
                  }
                : undefined
            }
            retrying={placeQuery.isFetching || recordsQuery.isFetching}
            title="장소의 기록을 불러오지 못했어요"
          />
        ) : (
          <>
            <section aria-labelledby="place-title" className="px-1 py-2">
              <h1 className="text-balance font-bold text-2xl tracking-[-0.035em]" id="place-title">
                {place.name}
              </h1>
              <p className="mt-1 text-muted-foreground text-sm">{place.address ?? "주소 정보 없음"}</p>
            </section>

            {recordsQuery.isPending ? null : records.length ? (
              <RecordTimeline aria-labelledby="place-records-title" className="gap-0">
                <div className="mb-2 flex items-center justify-between gap-3 px-1">
                  <h2 className="font-semibold text-base" id="place-records-title">
                    이곳의 기록
                  </h2>
                  <p className="text-muted-foreground text-xs">{records.length}개</p>
                </div>

                {records.map((record, index) => {
                  const { startsMonth } = getRecordTimelineItemState(records, index);
                  if (startsMonth) monthStartIndex = index;
                  const endsMonth = record.recorded_at.slice(0, 7) !== records[index + 1]?.recorded_at.slice(0, 7);

                  return (
                    <Fragment key={record.id}>
                      {startsMonth ? (
                        <p
                          className={cn(
                            "pb-6 text-center font-semibold text-lg tracking-tight",
                            index > 0 && "mt-6 border-border border-t border-dashed pt-7",
                          )}
                        >
                          {formatRecordTimelineMonth(record.recorded_at)}
                        </p>
                      ) : null}
                      <RecordCard
                        endsMonth={endsMonth}
                        onDetailPrefetch={prefetchComments}
                        record={record}
                        side={(index - monthStartIndex) % 2 === 0 ? "left" : "right"}
                      />
                    </Fragment>
                  );
                })}
              </RecordTimeline>
            ) : (
              <div className="flex flex-col items-center gap-6 py-8">
                <EmptyRecords title={`${place.name}에서 남긴 기록이 없어요`} />
                <RecordCreateButton href={`/records/new?placeId=${place.id}`}>
                  <NotePencilRoundedIcon aria-hidden="true" data-icon="inline-start" />
                  이곳에서 기록하기
                </RecordCreateButton>
              </div>
            )}
          </>
        )}
      </PageShell>
    </OverscrollBack>
  );
}
