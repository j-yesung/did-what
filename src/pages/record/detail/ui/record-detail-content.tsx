"use client";

import { useEffect, useRef } from "react";

import { CheckIcon, type CheckIconHandle, CopyIcon } from "@animateicons/react/lucide";
import { BookOpenIcon, CalendarDotsIcon, MapPinIcon, NotePencilIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getRecordWeatherLabel,
  normalizeRecordWeather,
  type RecordDetail,
  type RecordSummary,
  recordDetailQueryOptions,
  recordPlacesQueryOptions,
  recordSummaryQueryKey,
  WeatherIcon,
} from "@/entities/record";
import { PlaceSaveButton } from "@/features/place/save-place";
import { DeleteRecordButton } from "@/features/record/delete-record";
import { formatRecordPeriod } from "@/shared/lib/date/format-date";
import { Button } from "@/shared/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { IconButton } from "@/shared/ui/icon-button";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { OverscrollBack } from "@/shared/ui/overscroll-back";
import { PressLink } from "@/shared/ui/press-link";

import { useCopyToClipboard } from "../model/use-copy-to-clipboard";

type RecordDetailContentProps = {
  recordId: string;
};

export function RecordDetailContent({ recordId }: RecordDetailContentProps) {
  const copiedIconRef = useRef<CheckIconHandle>(null);

  const { copied: memoCopied, copy } = useCopyToClipboard();

  const queryClient = useQueryClient();
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
  const isPending = hasCachedSummary ? false : recordQuery.isPending;
  const hasError = hasCachedSummary ? recordPlacesQuery.isError : recordQuery.isError;
  const recordMissing = hasCachedSummary
    ? recordPlacesQuery.isSuccess && !recordPlacesQuery.data
    : recordQuery.isSuccess && !recordQuery.data;

  useEffect(() => {
    if (!memoCopied || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const frame = requestAnimationFrame(() => copiedIconRef.current?.startAnimation());
    return () => cancelAnimationFrame(frame);
  }, [memoCopied]);

  return (
    <OverscrollBack fallbackHref="/records">
      <PageShell>
        <PageHeader
          action={
            !recordMissing && record ? (
              <IconButton
                aria-label="기록 수정"
                icon={NotePencilIcon}
                iconSize={28}
                nativeButton={false}
                render={<PressLink href={`/records/${record.id}/edit`} />}
              />
            ) : undefined
          }
          back="/records"
          title="기록 상세"
        />

        {isPending ? null : recordMissing ? (
          <LoadErrorAlert icon={<NotePencilIcon strokeWidth={2} aria-hidden="true" />} title="기록을 찾을 수 없어요" />
        ) : hasError ? (
          <LoadErrorAlert
            icon={<NotePencilIcon strokeWidth={2} aria-hidden="true" />}
            title={hasCachedSummary ? "방문 장소 정보를 불러오지 못했어요" : "기록을 불러오지 못했어요"}
          />
        ) : record ? (
          <>
            <section aria-labelledby="record-activity-title" className="px-1 py-4">
              <h2
                className="mt-2 text-balance font-bold text-3xl leading-tight tracking-[-0.045em]"
                id="record-activity-title"
              >
                {record.activity}
              </h2>
              <p className="mt-3 text-muted-foreground text-sm">함께한 날의 기억을 다시 꺼내보세요.</p>
            </section>

            <Card>
              <CardHeader>
                <CardTitle>이날의 기록</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="grid grid-cols-[20px_1fr] gap-3">
                  <CalendarDotsIcon strokeWidth={2} className="size-5 text-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-muted-foreground text-xs">날짜</p>
                    <p className="mt-1 font-medium">{formatRecordPeriod(record.recorded_at, record.recorded_until)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-[20px_1fr] gap-3">
                  <WeatherIcon
                    weather={normalizeRecordWeather(record.weather)}
                    className="size-5 text-foreground"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-muted-foreground text-xs">날씨</p>
                    <p className="mt-1 font-medium">{getRecordWeatherLabel(normalizeRecordWeather(record.weather))}</p>
                  </div>
                </div>
                <div className="grid grid-cols-[20px_1fr] gap-3">
                  <MapPinIcon strokeWidth={2} className="size-5 text-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-muted-foreground text-xs">지역</p>
                    <p className="mt-1 font-medium">
                      {[record.region_label, record.region_name].filter(Boolean).join(" / ") || "지역 정보 없음"}
                    </p>
                  </div>
                </div>
                {recordPlaces ? <RecordPlaces recordPlaces={recordPlaces} /> : null}
              </CardContent>
            </Card>

            {record.memo ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpenIcon strokeWidth={2} className="size-5 text-foreground" aria-hidden="true" />
                    우리 뭐했지?
                  </CardTitle>
                  <CardAction className="flex items-center gap-1">
                    <Button
                      aria-label={memoCopied ? "메모 복사됨" : "메모 복사"}
                      className="size-7 min-w-0 gap-0 rounded-lg p-0"
                      onClick={() => void copy(record.memo ?? "")}
                      type="button"
                      variant="ghost"
                    >
                      {memoCopied ? (
                        <CheckIcon
                          className="text-success"
                          duration={0.8}
                          isAnimated={false}
                          ref={copiedIconRef}
                          size={20}
                        />
                      ) : (
                        <CopyIcon isAnimated={false} size={18} />
                      )}
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{record.memo}</p>
                </CardContent>
              </Card>
            ) : null}

            <footer className="flex justify-center py-2">
              <DeleteRecordButton activity={record.activity} recordId={record.id} />
            </footer>
          </>
        ) : null}
      </PageShell>
    </OverscrollBack>
  );
}

function RecordPlaces({ recordPlaces }: { recordPlaces: RecordDetail["record_places"] }) {
  if (recordPlaces.length === 0) return null;

  return (
    <div className="grid grid-cols-[20px_1fr] gap-3">
      <MapPinIcon strokeWidth={2} className="size-5 text-foreground" aria-hidden="true" />
      <div>
        <p className="text-muted-foreground text-xs">방문 장소</p>
        <ul className="mt-2 flex flex-col gap-2">
          {recordPlaces.map(({ place }) => (
            <li key={place.id}>
              <p className="font-medium">{place.name}</p>
              {place.address ? <p className="mt-0.5 text-muted-foreground text-sm">{place.address}</p> : null}
              {!place.saved_at ? (
                <div className="mt-2">
                  <PlaceSaveButton placeId={place.id} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
