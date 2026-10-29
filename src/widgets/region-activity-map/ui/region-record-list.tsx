"use client";

import { useEffect, useRef } from "react";

import { CaretRightIcon, ChatCircleIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";

import { prefetchRecordDetail, RecordCategoryBadge } from "@/entities/record";
import { recordCommentListQueryOptions } from "@/entities/record-comment";
import { type RegionActivityMap, RegionMiniMap } from "@/entities/region";
import { isPlainLeftClick } from "@/shared/lib/navigation/use-press-navigate";
import { cn } from "@/shared/lib/utils";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { PressLink } from "@/shared/ui/press-link";
import { Separator } from "@/shared/ui/separator";

import type { MapRecord } from "../model/record-map-points";
import { getRegionRecords, getSubregionCounts } from "../model/region-record-list";

type RegionRecordListProps = {
  records: readonly MapRecord[];
  region: RegionActivityMap | null;
  subregion: string | null;
  onSubregionChange: (subregion: string | null) => void;
  onRecordOpen: (recordId: string) => void;
  /** 기록을 누르는 순간(클릭 전) 불린다. 화면마다 필요한 조회를 미리 시작할 때 쓴다. */
  onRecordPress?: (recordId: string) => void;
  isDetail: boolean;
  currentRecordId?: string;
};

export function RegionRecordList({
  records,
  region,
  subregion,
  onSubregionChange,
  onRecordOpen,
  onRecordPress,
  isDetail,
  currentRecordId,
}: RegionRecordListProps) {
  const currentRow = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (!currentRecordId) return;
    const row = currentRow.current;
    const scroll = row?.closest("[data-record-scroll]");
    if (row && scroll) scroll.scrollTop += row.getBoundingClientRect().top - scroll.getBoundingClientRect().top - 32;
  }, [currentRecordId]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const regionRecords = getRegionRecords(records, region?.code);
  const subregionCounts = getSubregionCounts(regionRecords);
  // 주소로 되살린 칩이 지금 기록에 없는 이름이면 전체로 본다.
  const selectedSubregion =
    subregionCounts.length > 1 && subregionCounts.some(([name]) => name === subregion) ? subregion : null;

  // 누르는 순간 다음 화면 데이터를 받기 시작해, 넘어갔을 때 빈 화면이 잠깐 보이지 않게 한다.
  const prefetchRecord = (recordId: string) => {
    router.prefetch(`/records/${recordId}`);
    prefetchRecordDetail(queryClient, recordId);
    void queryClient.prefetchInfiniteQuery(recordCommentListQueryOptions(recordId));
  };
  const visibleRecords = selectedSubregion
    ? regionRecords.filter(({ subregions }) => subregions.includes(selectedSubregion))
    : regionRecords;
  const chips: [string | null, string, number][] = [
    [null, "전체", regionRecords.length],
    ...subregionCounts.map(([name, count]): [string, string, number] => [name, name, count]),
  ];
  const regionLabel = region?.label ?? "";

  return (
    <>
      <BottomSheet.Header className="text-left group-data-[swipe-axis=y]/bottom-sheet-popup:text-left">
        <div className="flex items-center gap-3">
          {region ? (
            <div className="size-15 shrink-0">
              <RegionMiniMap label={`${region.name}의 방문 지역 지도`} map={region} />
            </div>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {isDetail ? (
              <p className="break-keep font-bold text-foreground text-xl leading-7">{regionLabel}</p>
            ) : (
              <BottomSheet.Title className="break-keep font-bold text-xl leading-7">{regionLabel}</BottomSheet.Title>
            )}
            {regionRecords.length > 0 ? (
              <p className="break-keep text-muted-foreground text-sm tabular-nums">기록 {visibleRecords.length}개</p>
            ) : null}
          </div>
        </div>
      </BottomSheet.Header>

      {subregionCounts.length > 1 ? (
        <div
          aria-label="시·군·구"
          className="scrollbar-none flex shrink-0 gap-2 overflow-x-auto px-5 pt-3 pb-1"
          role="group"
        >
          {chips.map(([name, label, count]) => (
            <button
              aria-pressed={selectedSubregion === name}
              className={cn(
                "min-h-11 shrink-0 rounded-full px-3.5 font-medium text-muted-foreground text-sm tabular-nums transition-colors",
                selectedSubregion !== name && "bg-muted dark:bg-input/30",
                selectedSubregion === name && "bg-primary font-semibold text-primary-foreground",
              )}
              key={label}
              onClick={() => onSubregionChange(name)}
              type="button"
            >
              {label} {count}
            </button>
          ))}
        </div>
      ) : null}

      <div
        data-record-scroll
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4",
          regionRecords.length > 0 && "pb-[calc(--spacing(4)+env(safe-area-inset-bottom))]",
          visibleRecords.length === 0 && "flex items-center",
        )}
      >
        {visibleRecords.length > 0 ? (
          <>
            <h3 className="font-semibold text-sm">방문 기록</h3>
            <ul>
              {visibleRecords.map(({ record, subregions }, index) => {
                const date = format(parseISO(record.recorded_at), "yyyy.M.d");
                const until = record.recorded_until;
                const commentCount = record.record_comments?.[0]?.count ?? 0;
                const period =
                  until && until !== record.recorded_at
                    ? `${date}–${format(parseISO(until), until.slice(0, 4) === record.recorded_at.slice(0, 4) ? "M.d" : "yyyy.M.d")}`
                    : date;
                return (
                  <li key={record.id} ref={record.id === currentRecordId ? currentRow : undefined}>
                    {index > 0 ? <Separator className="bg-muted-foreground/20" /> : null}
                    <PressLink
                      className={cn(
                        buttonVariants({ variant: "ghost" }),
                        "h-auto min-h-15 w-full min-w-0 justify-start whitespace-normal rounded-none px-1 py-3.5 text-left font-normal after:hidden",
                      )}
                      href={`/records/${record.id}`}
                      onClick={(event) => {
                        if (!isPlainLeftClick(event)) return;
                        event.preventDefault();
                        onRecordOpen(record.id);
                      }}
                      onPointerDown={(event) => {
                        if (event.button !== 0) return;
                        prefetchRecord(record.id);
                        onRecordPress?.(record.id);
                      }}
                      prefetch={false}
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex min-w-0 items-center justify-between gap-2">
                          <span className="min-w-0 break-words font-semibold text-base leading-5">
                            {record.activity}
                          </span>
                          <CaretRightIcon aria-hidden="true" className="shrink-0" size={20} />
                        </span>
                        <span className="mt-1 flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
                          <time className="shrink-0 tabular-nums" dateTime={record.recorded_at}>
                            {period}
                          </time>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{subregions.join(", ")}</span>
                        </span>
                        <span className="mt-2 flex min-w-0 items-center justify-between gap-3">
                          <span className="flex min-w-0 flex-wrap gap-1">
                            <RecordCategoryBadge category={record.category} />
                          </span>
                          {commentCount > 0 ? (
                            <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] text-muted-foreground tabular-nums">
                              <ChatCircleIcon aria-hidden="true" className="size-4" />
                              <span className="sr-only">댓글</span>
                              {commentCount}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </PressLink>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyTitle className="text-muted-foreground">이 지역에 남긴 기록이 없어요</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      {/* 기록이 없는 지역에서는 바로 첫 기록을 남길 수 있게 한다. */}
      {region && regionRecords.length === 0 ? (
        <BottomSheet.Footer className="pt-3">
          <Button
            fullWidth
            nativeButton={false}
            render={<PressLink href={`/records/new?region=${region.code}`} />}
            size="xlarge"
          >
            기록 남기기
          </Button>
        </BottomSheet.Footer>
      ) : null}
    </>
  );
}
