"use client";

import { useState } from "react";

import { MapPinIcon, TrashIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { placeQueryOptions, placeRecordsQueryOptions, placesQueryOptions } from "@/entities/place";
import { EmptyRecords, RecordCreateButton, RecordTimelineItems } from "@/entities/record";
import { recordCommentListQueryOptions } from "@/entities/record-comment";
import { DeletePlaceConfirm } from "@/features/place/delete-place/ui/delete-place-confirm";
import { FixedToolbar, PageHeader, PageShell } from "@/shared/ui/layouts";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { OverscrollBack } from "@/shared/ui/overscroll-back";

type PlaceDetailContentProps = {
  placeId: string;
};

export function PlaceDetailContent({ placeId }: PlaceDetailContentProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const prefetchComments = (recordId: string) =>
    void queryClient.prefetchInfiniteQuery(recordCommentListQueryOptions(recordId));
  const placeQuery = useQuery({
    ...placeQueryOptions(placeId),
    initialData: () => queryClient.getQueryData(placesQueryOptions.queryKey)?.find(({ id }) => id === placeId),
  });
  const place = placeQuery.data;
  const recordsQuery = useQuery(placeRecordsQueryOptions(placeId));
  const records = (recordsQuery.data ?? [])
    .map(({ record }) => record)
    .toSorted((a, b) => b.recorded_at.localeCompare(a.recorded_at));

  return (
    <>
      <FixedToolbar className="justify-end gap-2">
        <RecordCreateButton className="pointer-events-auto" href={`/records/new?placeId=${placeId}`} />
      </FixedToolbar>
      <OverscrollBack fallbackHref="/places">
        <PageShell>
          <PageHeader back="/places" />

          {placeQuery.isPending ? null : placeQuery.isError || recordsQuery.isError || !place ? (
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
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-balance font-bold text-2xl tracking-[-0.035em]" id="place-title">
                      {place.name}
                    </h1>
                    <p className="mt-1 text-muted-foreground text-sm">{place.address ?? "주소 정보 없음"}</p>
                  </div>
                  {place.saved_at ? (
                    <LiquidGlassButton
                      aria-label="저장 목록에서 장소 제거"
                      className="text-destructive"
                      disabled={!recordsQuery.isSuccess}
                      onClick={() => setDeleteOpen(true)}
                      shape="circle"
                      title="저장 목록에서 장소 제거"
                    >
                      <TrashIcon aria-hidden="true" />
                    </LiquidGlassButton>
                  ) : null}
                </div>
              </section>

              {recordsQuery.isPending ? null : records.length ? (
                <section aria-labelledby="place-records-title" className="flex flex-col">
                  <div className="mb-2 flex items-center justify-between gap-3 px-1">
                    <h2 className="font-semibold text-base" id="place-records-title">
                      이곳의 기록
                    </h2>
                    <p className="text-muted-foreground text-xs">{records.length}개</p>
                  </div>

                  <RecordTimelineItems records={records} onDetailPrefetch={prefetchComments} />
                </section>
              ) : (
                <div className="flex flex-col items-center py-8">
                  <EmptyRecords title={`${place.name}에서 남긴 기록이 없어요`} />
                </div>
              )}
            </>
          )}
          <DeletePlaceConfirm
            name={place?.name ?? ""}
            onClose={() => setDeleteOpen(false)}
            onDeleted={() => router.replace("/places")}
            open={deleteOpen}
            placeId={placeId}
            recordCount={records.length}
          />
        </PageShell>
      </OverscrollBack>
    </>
  );
}
