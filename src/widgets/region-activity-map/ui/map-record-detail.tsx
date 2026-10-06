"use client";

import type { Dispatch, SetStateAction } from "react";

import { NotePencilIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { PlaceIconTile } from "@/entities/place";
import { formatRecordRegionLabels, RecordDetailHeader, recordDetailQueryOptions } from "@/entities/record";
import { PlaceSaveButton } from "@/features/place/save-place";
import { RecordComments } from "@/features/record-comment";
import { BackButton } from "@/shared/ui/back-button";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { PageSection } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { Spinner } from "@/shared/ui/spinner";

type MapRecordDetailProps = {
  draft: string;
  member: { id: string; name: string };
  onBack: () => void;
  onDraftChange: Dispatch<SetStateAction<string>>;
  recordId: string;
};

export function MapRecordDetail({ draft, member, onBack, onDraftChange, recordId }: MapRecordDetailProps) {
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
          <BottomSheet.Title className="sr-only">{record?.activity ?? "기록 상세"}</BottomSheet.Title>
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
              <section aria-labelledby="map-record-activity-title">
                <RecordDetailHeader record={record} regionText={regionText} titleId="map-record-activity-title" />
              </section>

              {record.record_places.length > 0 ? (
                <PageSection aria-labelledby="map-record-places-title" className="mx-0 border-0 px-1 pt-1">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-base" id="map-record-places-title">
                      우리 어디 갔지?
                    </h3>
                    <p className="text-muted-foreground text-xs">함께한 장소 {record.record_places.length}곳</p>
                  </div>
                  <ul className="flex flex-col">
                    {record.record_places.map(({ place }) => (
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
                  </ul>
                </PageSection>
              ) : null}

              {record.memo ? (
                <PageSection aria-labelledby="map-record-memo-title" className="mx-0 border-0 px-1 pt-1">
                  <h3 className="mb-3 font-semibold text-base" id="map-record-memo-title">
                    우리 뭐했지?
                  </h3>
                  <div className="flex flex-col gap-2 border-primary border-l-2 pl-4 text-sm leading-relaxed">
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
