"use client";

import { useMemo } from "react";

import { CaretRightIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";

import { RecordCategoryBadge, recordDetailQueryOptions } from "@/entities/record";
import { recordCommentListQueryOptions } from "@/entities/record-comment";
import { getRegionCode, type RegionActivityMap, RegionMiniMap } from "@/entities/region";
import { cn } from "@/shared/lib/utils";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { PressLink } from "@/shared/ui/press-link";
import { Separator } from "@/shared/ui/separator";

import { getSubregionName, type MapRecord } from "../model/record-map-points";

type RegionRecordListProps = {
  records: readonly MapRecord[];
  region: RegionActivityMap | null;
  subregion: string | null;
  onSubregionChange: (subregion: string | null) => void;
  onRecordOpen: (recordId: string) => void;
  isDetail: boolean;
};

export function RegionRecordList({
  records,
  region,
  subregion,
  onSubregionChange,
  onRecordOpen,
  isDetail,
}: RegionRecordListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const regionRecords = useMemo(
    () =>
      region
        ? records.flatMap((record) => {
            const subregions = [
              ...new Set(
                record.record_regions
                  .filter(({ region_code }) => getRegionCode(region_code) === region.code)
                  .map(({ region_name }) => getSubregionName(region_name)),
              ),
            ];
            return subregions.length > 0 ? [{ record, subregions }] : [];
          })
        : [],
    [records, region],
  );
  const subregionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { subregions } of regionRecords) {
      for (const name of subregions) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts].sort(([, first], [, second]) => second - first);
  }, [regionRecords]);
  // 주소로 되살린 칩이 지금 기록에 없는 이름이면 전체로 본다.
  const selectedSubregion =
    subregionCounts.length > 1 && subregionCounts.some(([name]) => name === subregion) ? subregion : null;

  // 누르는 순간 다음 화면 데이터를 받기 시작해, 넘어갔을 때 빈 화면이 잠깐 보이지 않게 한다.
  const prefetchRecord = (recordId: string) => {
    router.prefetch(`/records/${recordId}`);
    void queryClient.prefetchQuery(recordDetailQueryOptions(recordId));
    void queryClient.prefetchInfiniteQuery(recordCommentListQueryOptions(recordId));
  };
  const visibleRecords = useMemo(
    () =>
      selectedSubregion
        ? regionRecords.filter(({ subregions }) => subregions.includes(selectedSubregion))
        : regionRecords,
    [regionRecords, selectedSubregion],
  );
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
              <p className="break-keep font-bold text-foreground text-xl leading-7">{regionLabel}의 기억</p>
            ) : (
              <BottomSheet.Title className="break-keep font-bold text-xl leading-7">
                {regionLabel}의 기억
              </BottomSheet.Title>
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
                "min-h-9 shrink-0 rounded-full bg-muted px-3.5 font-medium text-muted-foreground text-sm tabular-nums transition-colors",
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
                const period =
                  until && until !== record.recorded_at
                    ? `${date}–${format(parseISO(until), until.slice(0, 4) === record.recorded_at.slice(0, 4) ? "M.d" : "yyyy.M.d")}`
                    : date;
                return (
                  <li key={record.id}>
                    {index > 0 ? <Separator className="bg-muted-foreground/20" /> : null}
                    <PressLink
                      className={cn(
                        buttonVariants({ variant: "ghost" }),
                        "h-15 w-full min-w-0 justify-start rounded-none px-1 py-2 text-left font-normal after:hidden",
                      )}
                      href={`/records/${record.id}`}
                      onClick={(event) => {
                        if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
                          return;
                        event.preventDefault();
                        onRecordOpen(record.id);
                      }}
                      onPointerDown={(event) => {
                        if (event.button === 0) prefetchRecord(record.id);
                      }}
                      prefetch={false}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center justify-between gap-2">
                          <span className="min-w-0 truncate font-semibold text-base leading-5">{record.activity}</span>
                          <RecordCategoryBadge category={record.category} />
                        </span>
                        <span className="mt-1 flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
                          <span className="shrink-0 tabular-nums">{period}</span>
                          {!selectedSubregion ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{subregions.join(", ")}</span>
                            </>
                          ) : null}
                        </span>
                      </span>
                      <CaretRightIcon aria-hidden="true" className="ml-2 shrink-0" size={20} />
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
