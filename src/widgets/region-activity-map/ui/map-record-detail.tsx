"use client";

import type { Dispatch, SetStateAction } from "react";

import { NotePencilIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { formatRecordRegionLabels, RecordBadges, recordDetailQueryOptions } from "@/entities/record";
import { PlaceSaveButton } from "@/features/place/save-place";
import { RecordComments } from "@/features/record-comment";
import { formatRecordPeriod } from "@/shared/lib/date/format-date";
import { BackButton } from "@/shared/ui/back-button";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { PageSection } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { Spinner } from "@/shared/ui/spinner";

type MapRecordDetailProps = {
  active: boolean;
  draft: string;
  member: { id: string; name: string };
  onBack: () => void;
  onDraftChange: Dispatch<SetStateAction<string>>;
  recordId: string;
};

export function MapRecordDetail({ active, draft, member, onBack, onDraftChange, recordId }: MapRecordDetailProps) {
  const recordQuery = useQuery(recordDetailQueryOptions(recordId));
  const record = recordQuery.data;
  const regionText = record ? formatRecordRegionLabels(record, Number.POSITIVE_INFINITY) : "";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="absolute top-7 left-5 z-20">
        <BackButton aria-label="지역 기록 목록으로" onClick={onBack} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(--spacing(5)+env(safe-area-inset-bottom))]">
        <BottomSheet.Header className="pt-7 text-left" glass>
          {active ? <BottomSheet.Title className="sr-only">{record?.activity ?? "기록 상세"}</BottomSheet.Title> : null}
        </BottomSheet.Header>
        <div aria-hidden="true" className="h-(--toolbar-height)" />
        <div className="px-5 pt-6">
          {recordQuery.isSuccess && !record ? (
            <LoadErrorAlert icon={<NotePencilIcon aria-hidden="true" />} title="기록을 찾을 수 없어요" />
          ) : recordQuery.isError ? (
            <LoadErrorAlert
              icon={<NotePencilIcon aria-hidden="true" />}
              onRetry={() => void recordQuery.refetch()}
              retrying={recordQuery.isFetching}
              title="기록을 불러오지 못했어요"
            />
          ) : record ? (
            <div className="flex flex-col gap-5">
              <section aria-labelledby="map-record-activity-title" className="px-1">
                <h2
                  className="text-balance font-bold text-3xl leading-tight tracking-[-0.045em]"
                  id="map-record-activity-title"
                >
                  {record.activity}
                </h2>
                <p className="mt-2 text-muted-foreground text-sm">
                  {[formatRecordPeriod(record.recorded_at, record.recorded_until), regionText]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <RecordBadges className="px-2 py-1" record={record} />
                </div>
              </section>

              {record.record_places.length > 0 ? (
                <PageSection aria-labelledby="map-record-places-title">
                  <h3 className="mb-3 font-semibold text-base" id="map-record-places-title">
                    우리 어디 갔지?
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {record.record_places.map(({ place }) => (
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
                <PageSection aria-labelledby="map-record-memo-title">
                  <h3 className="mb-3 font-semibold text-base" id="map-record-memo-title">
                    우리 뭐했지?
                  </h3>
                  <div className="flex flex-col gap-2 text-sm leading-relaxed">
                    {record.memo.split("\n").map((line, index) => (
                      <p className="min-h-lh whitespace-pre-wrap" key={`${record.id}-${index}`}>
                        {line}
                      </p>
                    ))}
                  </div>
                </PageSection>
              ) : null}

              <RecordComments draft={draft} member={member} onDraftChange={onDraftChange} recordId={record.id} />
            </div>
          ) : (
            <div className="flex justify-center py-12">
              <Spinner aria-label="기록을 불러오는 중" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
