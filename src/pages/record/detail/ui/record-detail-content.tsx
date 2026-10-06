"use client";

import { useEffect, useRef } from "react";

import { NotePencilIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import { NOTIFICATIONS_QUERY_KEY } from "@/entities/notification";
import { PlaceIconTile } from "@/entities/place";
import {
  formatRecordRegionLabels,
  RecordDetailHeader,
  type RecordSummary,
  recordDetailQueryOptions,
  recordPlacesQueryOptions,
  recordSummaryQueryKey,
} from "@/entities/record";
import { readRecordNotifications } from "@/features/notification/read-record-notifications";
import { PlaceSaveButton } from "@/features/place/save-place";
import { RecordComments } from "@/features/record-comment";
import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { showToast } from "@/shared/lib/toast";
import { PageHeader, PageSection, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { OverscrollBack } from "@/shared/ui/overscroll-back";

type RecordDetailContentProps = {
  member: { id: string; name: string };
  recordId: string;
};

export function RecordDetailContent({ member, recordId }: RecordDetailContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedMissingRecord = useRef(false);
  const readNotifications = useRef(false);
  const queryClient = useQueryClient();
  const fromNotification = searchParams?.get("from") === "notification";
  const summaryQueryKey = recordSummaryQueryKey(recordId);
  const cachedSummary = queryClient.getQueryState(summaryQueryKey)?.isInvalidated
    ? undefined
    : queryClient.getQueryData<RecordSummary>(summaryQueryKey);
  const hasCachedSummary = Boolean(cachedSummary);
  const recordQuery = useQuery({
    ...recordDetailQueryOptions(recordId),
    enabled: !hasCachedSummary,
  });
  const recordPlacesQuery = useQuery({
    ...recordPlacesQueryOptions(recordId),
    enabled: hasCachedSummary,
  });
  const record = recordQuery.data ?? cachedSummary;
  // 상세 응답이 오기 전에는 목록에서 넘겨받은 요약의 방문 지역으로 먼저 그린다.
  const regionText = formatRecordRegionLabels(
    {
      record_regions:
        recordQuery.data?.record_regions ?? recordPlacesQuery.data?.record_regions ?? cachedSummary?.record_regions,
      region_code: record?.region_code,
      region_label: record?.region_label,
    },
    Number.POSITIVE_INFINITY,
  );
  const recordPlaces = recordQuery.data?.record_places ?? recordPlacesQuery.data?.record_places;
  const hasError = !hasCachedSummary && recordQuery.isError;
  const placesError = hasCachedSummary && recordPlacesQuery.isError;
  const placeCount = recordPlaces?.length ?? cachedSummary?.record_places?.[0]?.count ?? 0;
  const recordMissing = hasCachedSummary
    ? recordPlacesQuery.isSuccess && !recordPlacesQuery.data
    : recordQuery.isSuccess && !recordQuery.data;

  // 푸시와 알림 목록 모두 이 주소로 들어온다. 읽음 처리를 여기 한 곳에서 해서 알림을 연 곳과 상관없이 점이 사라진다.
  useEffect(() => {
    if (!fromNotification || readNotifications.current) return;

    readNotifications.current = true;
    void runServerAction(() => readRecordNotifications(recordId))
      .then(() => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }))
      .catch(() => {
        // 읽음 표시는 부가 기능이라 실패해도 기록 보기를 막지 않는다.
      });
  }, [fromNotification, queryClient, recordId]);

  useEffect(() => {
    if (!fromNotification || !recordMissing || redirectedMissingRecord.current) return;

    redirectedMissingRecord.current = true;
    showToast({ title: "기록이 삭제됐어요", variant: "warning" });
    router.replace("/records");
  }, [fromNotification, recordMissing, router]);

  return (
    <OverscrollBack fallbackHref="/records">
      <PageShell>
        <PageHeader back="/records" />

        {recordMissing && !fromNotification ? (
          <LoadErrorAlert icon={<NotePencilIcon aria-hidden="true" />} title="기록을 찾을 수 없어요" />
        ) : hasError ? (
          <LoadErrorAlert
            icon={<NotePencilIcon aria-hidden="true" />}
            onRetry={() => void recordQuery.refetch()}
            retrying={recordQuery.isFetching}
            title="기록을 불러오지 못했어요"
          />
        ) : record ? (
          <>
            <div className="flex flex-1 flex-col gap-5">
              <section aria-labelledby="record-activity-title">
                <RecordDetailHeader
                  heading="h1"
                  record={record}
                  regionText={regionText}
                  titleId="record-activity-title"
                />
              </section>

              {placesError ? (
                <LoadErrorAlert
                  onRetry={() => void recordPlacesQuery.refetch()}
                  retrying={recordPlacesQuery.isFetching}
                  title="방문 장소 정보를 불러오지 못했어요"
                />
              ) : placeCount > 0 ? (
                <PageSection aria-labelledby="record-places-title" className="mx-0 border-0 px-1 pt-1">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="font-semibold text-base" id="record-places-title">
                      우리 어디 갔지?
                    </h2>
                    <p className="text-muted-foreground text-xs">함께한 장소 {placeCount}곳</p>
                  </div>
                  <ul aria-busy={!recordPlaces || undefined} className="flex flex-col">
                    {(recordPlaces ?? []).map(({ place }) => (
                      <li className="flex min-h-11 items-center gap-3 border-b py-3" key={place.id}>
                        <PlaceIconTile place={place} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{place.name}</p>
                          {place.address ? (
                            <p className="mt-0.5 truncate text-muted-foreground text-xs">{place.address}</p>
                          ) : null}
                        </div>
                        <PlaceSaveButton placeId={place.id} placeName={place.name} saved={Boolean(place.saved_at)} />
                      </li>
                    ))}
                    {recordPlaces
                      ? null
                      : Array.from({ length: placeCount }, (_, index) => (
                          <li
                            aria-hidden="true"
                            className="h-11 animate-pulse rounded-lg bg-muted"
                            key={`${record.id}-place-skeleton-${index}`}
                          />
                        ))}
                  </ul>
                </PageSection>
              ) : null}

              {record.memo ? (
                <PageSection aria-labelledby="record-memo-title" className="mx-0 border-0 px-1 pt-1">
                  <h2 className="mb-3 font-semibold text-base" id="record-memo-title">
                    우리 뭐했지?
                  </h2>
                  <div className="flex flex-col gap-2 border-primary border-l-2 pl-4 text-sm leading-relaxed">
                    {record.memo.split("\n").map((line, index) => (
                      <p className="min-h-lh whitespace-pre-wrap" key={`${record.id}-${index}`}>
                        {line}
                      </p>
                    ))}
                  </div>
                </PageSection>
              ) : null}
            </div>

            <RecordComments member={member} recordId={record.id} />
          </>
        ) : null}
      </PageShell>
    </OverscrollBack>
  );
}
