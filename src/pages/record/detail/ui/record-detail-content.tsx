"use client";

import { useEffect, useRef } from "react";

import { NotePencilIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import { NOTIFICATIONS_QUERY_KEY } from "@/entities/notification";
import {
  formatRecordRegionLabels,
  RecordDetailHeader,
  type RecordSummary,
  recordDetailQueryOptions,
  recordSummaryQueryKey,
} from "@/entities/record";
import { readRecordNotifications } from "@/features/notification/read-record-notifications";
import { RecordComments } from "@/features/record-comment";
import { useActionOverride } from "@/shared/lib/action-override";
import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { showToast } from "@/shared/lib/toast";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { OverscrollBack } from "@/shared/ui/overscroll-back";
import { RecordDetailSections } from "@/widgets/record-detail-sections";

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
  const markRecordRead = useActionOverride(readRecordNotifications);
  const fromNotification = searchParams?.get("from") === "notification";
  const summaryQueryKey = recordSummaryQueryKey(recordId);
  const summaryState = queryClient.getQueryState<RecordSummary>(summaryQueryKey);
  const cachedSummary = summaryState?.isInvalidated ? undefined : summaryState?.data;
  const recordQuery = useQuery({
    ...recordDetailQueryOptions(recordId),
    refetchOnMount: "always",
  });
  const recordMissing = recordQuery.isSuccess && !recordQuery.data;
  const summaryIsNewer = cachedSummary && (summaryState?.dataUpdatedAt ?? 0) > recordQuery.dataUpdatedAt;
  const record = recordMissing ? null : summaryIsNewer ? cachedSummary : (recordQuery.data ?? cachedSummary);
  const regionText = record ? formatRecordRegionLabels(record, Number.POSITIVE_INFINITY) : "";
  const recordPlaces = recordQuery.data?.record_places;
  const placeCount = recordPlaces?.length ?? cachedSummary?.record_places?.[0]?.count ?? 0;

  // 푸시와 알림 목록 모두 이 주소로 들어온다. 읽음 처리를 여기 한 곳에서 해서 알림을 연 곳과 상관없이 점이 사라진다.
  useEffect(() => {
    if (!fromNotification || readNotifications.current) return;

    readNotifications.current = true;
    void runServerAction(() => markRecordRead(recordId))
      .then(() => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }))
      .catch(() => {
        // 읽음 표시는 부가 기능이라 실패해도 기록 보기를 막지 않는다.
      });
  }, [fromNotification, markRecordRead, queryClient, recordId]);

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
        ) : recordQuery.isError ? (
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

              <RecordDetailSections
                idPrefix="record"
                memo={record.memo}
                places={recordPlaces}
                placeCount={placeCount}
              />
            </div>

            <RecordComments member={member} recordId={record.id} />
          </>
        ) : null}
      </PageShell>
    </OverscrollBack>
  );
}
