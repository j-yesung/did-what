"use client";

import { useMemo, useState } from "react";

import { CaretRightIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";

import { recordDetailQueryOptions, regionRecordsQueryOptions } from "@/entities/record";
import { recordCommentListQueryOptions } from "@/entities/record-comment";
import { getRegionCode, type Region } from "@/entities/region";
import { cn } from "@/shared/lib/utils";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { PressLink } from "@/shared/ui/press-link";
import { Separator } from "@/shared/ui/separator";

import { getSubregionName, type MapRecord } from "../model/record-map-points";
import { MapRecordDetail } from "./map-record-detail";

type RegionRecordsBottomSheetProps = {
  detailRecordId: string | null;
  member: { id: string; name: string };
  onBeforeDetailOpen: () => void;
  onDetailBack: () => void;
  onOpenChange: (open: boolean) => void;
  onRecordOpen: (recordId: string) => void;
  onSubregionChange: (subregion: string | null) => void;
  open: boolean;
  records: readonly MapRecord[];
  region: Region | null;
  subregion: string | null;
};

export function RegionRecordsBottomSheet({
  detailRecordId,
  member,
  onBeforeDetailOpen,
  onDetailBack,
  onOpenChange,
  onRecordOpen,
  onSubregionChange,
  open,
  records,
  region,
  subregion,
}: RegionRecordsBottomSheetProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const isDetail = Boolean(detailRecordId) && open;

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (nextOpen) return;
    setDrafts({});
  };
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
  const selectedSubregion = subregionCounts.some(([name]) => name === subregion) ? subregion : null;

  // 누르는 순간 다음 화면 데이터를 받기 시작해, 넘어갔을 때 빈 화면이 잠깐 보이지 않게 한다.
  const prefetchRecord = (recordId: string) => {
    router.prefetch(`/records/${recordId}`);
    void queryClient.prefetchQuery(recordDetailQueryOptions(recordId));
    void queryClient.prefetchInfiniteQuery(recordCommentListQueryOptions(recordId));
  };
  const prefetchRegion = (target: Region) => {
    router.prefetch(`/regions/${target.code}`);
    void queryClient.prefetchQuery(regionRecordsQueryOptions(target));
  };
  const visibleRecords = selectedSubregion
    ? regionRecords.filter(({ subregions }) => subregions.includes(selectedSubregion))
    : regionRecords;
  const subregionChips = subregionCounts.map(([name, count]): [string, string, number] => [name, name, count]);
  // 한 곳만 다녀왔으면 전체와 그 한 곳이 같은 목록이라, 그 지역 칩 하나만 선택된 모습으로 보여준다.
  const singleSubregion = subregionCounts.length === 1 ? subregionCounts[0][0] : null;
  const chips: [string | null, string, number][] = singleSubregion
    ? subregionChips
    : [[null, "전체", regionRecords.length], ...subregionChips];
  const activeChip = singleSubregion ?? selectedSubregion;

  return (
    <BottomSheet disableContentSwipe={isDetail} onOpenChange={handleOpenChange} open={open} showSwipeHandle>
      <BottomSheet.VirtualKeyboardProvider>
        <BottomSheet.Content
          className={
            isDetail
              ? "bottom-[var(--drawer-keyboard-inset,0px)] pt-[env(safe-area-inset-top)] [--drawer-content-max-height:calc(100dvh-var(--drawer-keyboard-inset,0px))] [--drawer-height:calc(100dvh-var(--drawer-keyboard-inset,0px))]"
              : undefined
          }
        >
          <div className={cn("flex min-h-0 flex-1 flex-col", isDetail && "hidden")} key={region?.code}>
            <BottomSheet.Header className="text-left group-data-[swipe-axis=y]/bottom-sheet-popup:text-left">
              {!isDetail && (
                <BottomSheet.Title className="truncate font-bold text-xl leading-7">{region?.name}</BottomSheet.Title>
              )}
              <p className="text-muted-foreground text-sm tabular-nums">기록 {regionRecords.length}개</p>
            </BottomSheet.Header>

            {subregionCounts.length > 0 ? (
              <div
                aria-label="시·군·구"
                className="scrollbar-none flex shrink-0 gap-2 overflow-x-auto px-5 pt-3 pb-1"
                role="group"
              >
                {chips.map(([name, label, count]) => (
                  <button
                    aria-pressed={activeChip === name}
                    className={cn(
                      "min-h-9 shrink-0 rounded-full bg-muted px-3.5 font-medium text-muted-foreground text-sm tabular-nums transition-colors",
                      activeChip === name && "bg-primary font-semibold text-primary-foreground",
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

            {/* 칩으로 목록을 좁혀도 시트가 출렁이지 않게, 목록 칸은 전체 목록 높이(윗여백 + 줄 h-15 + 구분선 1px)로 둔다.
            목록이 시트 최대 높이를 넘으면 칸이 줄어들며 스크롤된다. */}
            <div
              className="min-h-0 overflow-y-auto overscroll-contain px-5 pt-2"
              style={
                regionRecords.length > 0
                  ? {
                      height: `calc(var(--spacing) * 2 + ${regionRecords.length} * var(--spacing) * 15 + ${regionRecords.length - 1}px)`,
                    }
                  : undefined
              }
            >
              {visibleRecords.length > 0 ? (
                <ul>
                  {visibleRecords.map(({ record, subregions }, index) => (
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
                          onBeforeDetailOpen();
                          onRecordOpen(record.id);
                        }}
                        onPointerDown={(event) => {
                          if (event.button === 0) prefetchRecord(record.id);
                        }}
                        prefetch={false}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-base leading-5">{record.activity}</span>
                          <span className="mt-1 block truncate text-muted-foreground text-xs">
                            <span className="tabular-nums">{format(parseISO(record.recorded_at), "yyyy.M.d")}</span>
                            {" · "}
                            {subregions.join(", ")}
                          </span>
                        </span>
                        <CaretRightIcon aria-hidden="true" className="ml-2 shrink-0" size={20} />
                      </PressLink>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyTitle className="text-muted-foreground">이 지역에 남긴 기록이 없어요</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              )}
            </div>

            {/* 기록이 없는 지역에서 '전체 보기'는 빈 화면을 한 번 더 거칠 뿐이라, 기록 남기기를 주 버튼으로 둔다. */}
            {region && regionRecords.length === 0 ? (
              <BottomSheet.Footer className="pt-3">
                <Button fullWidth nativeButton={false} render={<PressLink href="/records/new" />} size="xlarge">
                  기록 남기기
                </Button>
              </BottomSheet.Footer>
            ) : region ? (
              <BottomSheet.Footer className="pt-3">
                <Button
                  fullWidth
                  nativeButton={false}
                  render={
                    <PressLink
                      href={`/regions/${region.code}`}
                      onPointerDown={(event) => {
                        if (event.button === 0) prefetchRegion(region);
                      }}
                      prefetch={false}
                    />
                  }
                  size="xlarge"
                >
                  {region.name} 기록 전체 보기
                </Button>
              </BottomSheet.Footer>
            ) : null}
          </div>
          {isDetail && detailRecordId ? (
            <MapRecordDetail
              draft={drafts[detailRecordId] ?? ""}
              member={member}
              onBack={onDetailBack}
              onDraftChange={(next) =>
                setDrafts((current) => ({
                  ...current,
                  [detailRecordId]: typeof next === "function" ? next(current[detailRecordId] ?? "") : next,
                }))
              }
              recordId={detailRecordId}
            />
          ) : null}
        </BottomSheet.Content>
      </BottomSheet.VirtualKeyboardProvider>
    </BottomSheet>
  );
}
