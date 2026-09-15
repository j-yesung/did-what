"use client";

import { useEffect, useRef } from "react";

import { NotePencilIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import {
  getRecordWeatherLabel,
  normalizeRecordWeather,
  type RecordSummary,
  recordDetailQueryOptions,
  recordPlacesQueryOptions,
  recordSummaryQueryKey,
} from "@/entities/record";
import { PlaceSaveButton } from "@/features/place/save-place";
import { DeleteRecordButton } from "@/features/record/delete-record";
import { RecordComments } from "@/features/record-comment";
import { formatRecordPeriod } from "@/shared/lib/date/format-date";
import { HOME_HISTORY_GUARD } from "@/shared/lib/navigation/home-history-guard";
import { canGoBack } from "@/shared/lib/navigation/use-go-back";
import { showNotice } from "@/shared/lib/notice";
import { IconButton } from "@/shared/ui/icon-button";
import { PageHeader, PageSection, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { OverscrollBack } from "@/shared/ui/overscroll-back";
import { PressLink } from "@/shared/ui/press-link";

type RecordDetailContentProps = {
  member: { id: string; name: string };
  recordId: string;
};

export function RecordDetailContent({ member, recordId }: RecordDetailContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seededNotificationHistory = useRef(false);
  const redirectedMissingRecord = useRef(false);
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
  const recordPlaces = recordQuery.data?.record_places ?? recordPlacesQuery.data?.record_places;
  const hasError = hasCachedSummary ? recordPlacesQuery.isError : recordQuery.isError;
  const recordMissing = hasCachedSummary
    ? recordPlacesQuery.isSuccess && !recordPlacesQuery.data
    : recordQuery.isSuccess && !recordQuery.data;

  useEffect(() => {
    if (!fromNotification || canGoBack()) return;

    const detailHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const state = window.history.state;
    window.history.replaceState(state, "", "/");
    window.history.pushState({ ...state, [HOME_HISTORY_GUARD]: true }, "", "/");
    window.history.pushState(state, "", "/records");
    window.history.pushState(state, "", detailHref);
    seededNotificationHistory.current = true;
  }, [fromNotification]);

  useEffect(() => {
    if (!fromNotification || !recordMissing || redirectedMissingRecord.current) return;

    redirectedMissingRecord.current = true;
    showNotice({ title: "기록이 삭제됐어요", variant: "warning" });
    if (seededNotificationHistory.current) router.back();
    else router.replace("/records");
  }, [fromNotification, recordMissing, router]);

  return (
    <OverscrollBack fallbackHref="/records">
      <PageShell>
        <PageHeader
          action={
            !recordMissing && record ? (
              <div className="flex items-center gap-2">
                <IconButton
                  aria-label="기록 수정"
                  icon={NotePencilIcon}
                  iconSize={28}
                  nativeButton={false}
                  render={<PressLink href={`/records/${record.id}/edit`} />}
                />
                <DeleteRecordButton activity={record.activity} recordId={record.id} />
              </div>
            ) : undefined
          }
          back="/records"
        />

        {recordMissing && !fromNotification ? (
          <LoadErrorAlert icon={<NotePencilIcon strokeWidth={2} aria-hidden="true" />} title="기록을 찾을 수 없어요" />
        ) : hasError ? (
          <LoadErrorAlert
            icon={<NotePencilIcon strokeWidth={2} aria-hidden="true" />}
            title={hasCachedSummary ? "방문 장소 정보를 불러오지 못했어요" : "기록을 불러오지 못했어요"}
          />
        ) : record ? (
          <>
            <section aria-labelledby="record-activity-title" className="p-1">
              <h1
                className="mt-2 text-balance font-bold text-3xl leading-tight tracking-[-0.045em]"
                id="record-activity-title"
              >
                {record.activity}
              </h1>
              <p className="mt-2 text-muted-foreground text-sm">
                {`${formatRecordPeriod(record.recorded_at, record.recorded_until)} · ${getRecordWeatherLabel(normalizeRecordWeather(record.weather))}`}
              </p>
              <p className="mt-1 text-muted-foreground text-sm">
                {[record.region_label, record.region_name].filter(Boolean).join(" / ") || "지역 정보 없음"}
              </p>
            </section>

            {recordPlaces && recordPlaces.length > 0 ? (
              <PageSection aria-labelledby="record-places-title">
                <h2 className="mb-3 font-semibold text-base" id="record-places-title">
                  우리 어디 갔지?
                </h2>
                <ul className="flex flex-col gap-2">
                  {recordPlaces.map(({ place }) => (
                    <li className="flex min-h-11 items-center justify-between gap-3" key={place.id}>
                      <div className="min-w-0">
                        <p className="font-medium">{place.name}</p>
                        {place.address ? (
                          <p className="mt-0.5 truncate text-muted-foreground text-xs">{place.address}</p>
                        ) : null}
                      </div>
                      <PlaceSaveButton placeId={place.id} placeName={place.name} saved={Boolean(place.saved_at)} />
                    </li>
                  ))}
                </ul>
              </PageSection>
            ) : null}

            {record.memo ? (
              <PageSection aria-labelledby="record-memo-title">
                <h2 className="mb-3 font-semibold text-base" id="record-memo-title">
                  우리 뭐했지?
                </h2>
                <div className="flex flex-col gap-2 text-sm leading-relaxed">
                  {record.memo.split("\n").map((line, index) => (
                    <p className="min-h-lh whitespace-pre-wrap" key={`${record.id}-${index}`}>
                      {line}
                    </p>
                  ))}
                </div>
              </PageSection>
            ) : null}

            <RecordComments member={member} recordId={record.id} />
          </>
        ) : null}
      </PageShell>
    </OverscrollBack>
  );
}
