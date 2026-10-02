"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { CaretRightIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";

import { recordDetailQueryOptions, toRegionLocations } from "@/entities/record";
import { recordCommentListQueryOptions } from "@/entities/record-comment";
import { createRegionActivityMaps, getRegionCode, type Region, RegionMiniMap } from "@/entities/region";
import { cn } from "@/shared/lib/utils";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { PressLink } from "@/shared/ui/press-link";
import { Separator } from "@/shared/ui/separator";

import { getSubregionName, type MapRecord } from "../model/record-map-points";
import { MapRecordDetail } from "./map-record-detail";

const DETAIL_HEIGHT = "calc(100dvh - env(safe-area-inset-top) - 16px - var(--drawer-keyboard-inset, 0px))";

type RegionRecordsBottomSheetProps = {
  detailRecordId: string | null;
  member: { id: string; name: string };
  onBeforeDetailOpen: () => void;
  onCloseComplete: () => void;
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
  onCloseComplete,
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
  const popupRef = useRef<HTMLDivElement>(null);
  const listHeightRef = useRef<number | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [displayedDetailId, setDisplayedDetailId] = useState(detailRecordId);
  const [detailEntered, setDetailEntered] = useState(Boolean(detailRecordId));
  const [heightLocked, setHeightLocked] = useState(false);
  const [sheetHeight, setSheetHeight] = useState<string | null>(null);
  const isDetail = Boolean(detailRecordId);
  const renderedDetailId = detailRecordId ?? displayedDetailId;
  const regionMap = useMemo(
    () =>
      region
        ? createRegionActivityMaps(toRegionLocations(records)).find(({ code }) => code === region.code)
        : undefined,
    [records, region],
  );

  // 브라우저 뒤로가기에서도 마지막 상세를 잠깐 남겨 두 화면을 교차 전환한다.
  useEffect(() => {
    if (detailRecordId) setDisplayedDetailId(detailRecordId);
  }, [detailRecordId]);

  useEffect(() => {
    if (!isDetail) {
      setDetailEntered(false);
      return;
    }
    let nextFrame = 0;
    const frame = requestAnimationFrame(() => {
      nextFrame = requestAnimationFrame(() => setDetailEntered(true));
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(nextFrame);
    };
  }, [isDetail]);

  // auto 높이는 전환되지 않으므로 목록의 실제 높이에서 시작해 다음 프레임에 목표 높이로 옮긴다.
  useEffect(() => {
    if (!open || listHeightRef.current === null) return;
    let nextFrame = 0;
    const frame = requestAnimationFrame(() => {
      nextFrame = requestAnimationFrame(() => {
        setHeightLocked(false);
        setSheetHeight(isDetail ? DETAIL_HEIGHT : `${listHeightRef.current}px`);
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(nextFrame);
    };
  }, [isDetail, open]);

  const handleOpenChangeComplete = (nextOpen: boolean) => {
    if (nextOpen) return;
    setDrafts({});
    setDisplayedDetailId(null);
    setDetailEntered(false);
    setHeightLocked(false);
    setSheetHeight(null);
    listHeightRef.current = null;
    onCloseComplete();
  };
  const handleRecordOpen = (recordId: string) => {
    const height = popupRef.current?.getBoundingClientRect().height;
    if (height) {
      listHeightRef.current = height;
    }
    flushSync(() => {
      setDisplayedDetailId(recordId);
      setDetailEntered(false);
      if (height) {
        setHeightLocked(true);
        setSheetHeight(`${height}px`);
      }
    });
    onBeforeDetailOpen();
    onRecordOpen(recordId);
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
    <BottomSheet
      onOpenChange={onOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
      open={open}
      showSwipeHandle
    >
      <BottomSheet.VirtualKeyboardProvider>
        <BottomSheet.Content
          overlayHandle
          className={cn(
            "[--drawer-content-max-height:calc(100dvh-env(safe-area-inset-top)-16px-var(--drawer-keyboard-inset,0px))]",
            !heightLocked && "transition-[transform,height,opacity,filter]",
            isDetail && "bottom-(--drawer-keyboard-inset,0px)",
          )}
          onTransitionEnd={(event) => {
            if (!isDetail && event.target === event.currentTarget && event.propertyName === "height") {
              setSheetHeight(null);
            }
          }}
          ref={popupRef}
          style={{ height: sheetHeight ?? (isDetail ? DETAIL_HEIGHT : undefined) }}
        >
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              aria-hidden={isDetail}
              className={cn(
                "flex max-h-[calc(75dvh-1px)] min-h-0 flex-1 flex-col pt-7 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                isDetail
                  ? "pointer-events-none absolute inset-x-0 top-0 translate-y-1 opacity-0"
                  : "relative translate-y-0 opacity-100 delay-75",
              )}
              inert={isDetail}
              key={region?.code}
            >
              <BottomSheet.Header className="text-left group-data-[swipe-axis=y]/bottom-sheet-popup:text-left">
                <div className="flex items-center gap-4">
                  {regionMap ? (
                    <div className="size-22 shrink-0">
                      <RegionMiniMap label={`${regionMap.name}의 방문 지역 지도`} map={regionMap} />
                    </div>
                  ) : null}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {!isDetail && (
                      <BottomSheet.Title className="break-keep font-bold text-xl leading-7">
                        {region?.name}
                      </BottomSheet.Title>
                    )}
                    {regionMap ? (
                      <p className="break-keep text-muted-foreground text-sm tabular-nums">
                        {regionMap.totalCount}곳 중 {regionMap.visitedCount}곳 방문
                      </p>
                    ) : null}
                    <p className="text-muted-foreground text-sm tabular-nums">
                      함께 남긴 기록 {regionRecords.length}개
                    </p>
                  </div>
                </div>
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

              <div
                className={cn(
                  "min-h-0 overflow-y-auto overscroll-contain px-5 pt-2",
                  regionRecords.length > 0 && "pb-[calc(--spacing(4)+env(safe-area-inset-bottom))]",
                )}
                style={
                  regionRecords.length > 0
                    ? {
                        height: `calc(var(--spacing) * 6 + env(safe-area-inset-bottom) + ${regionRecords.length} * var(--spacing) * 15 + ${regionRecords.length - 1}px)`,
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
                            handleRecordOpen(record.id);
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

              {/* 기록이 없는 지역에서는 바로 첫 기록을 남길 수 있게 한다. */}
              {region && regionRecords.length === 0 ? (
                <BottomSheet.Footer className="pt-3">
                  <Button fullWidth nativeButton={false} render={<PressLink href="/records/new" />} size="xlarge">
                    기록 남기기
                  </Button>
                </BottomSheet.Footer>
              ) : null}
            </div>
            {renderedDetailId ? (
              <div
                aria-hidden={!isDetail}
                className={cn(
                  "flex min-h-0 flex-1 flex-col transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                  isDetail
                    ? "relative motion-reduce:translate-y-0 motion-reduce:opacity-100"
                    : "pointer-events-none absolute inset-0",
                  isDetail && detailEntered ? "translate-y-0 opacity-100 delay-75" : "translate-y-1 opacity-0",
                )}
                inert={!isDetail}
              >
                <MapRecordDetail
                  active={isDetail}
                  draft={drafts[renderedDetailId] ?? ""}
                  member={member}
                  onBack={onDetailBack}
                  onDraftChange={(next) =>
                    setDrafts((current) => ({
                      ...current,
                      [renderedDetailId]: typeof next === "function" ? next(current[renderedDetailId] ?? "") : next,
                    }))
                  }
                  recordId={renderedDetailId}
                />
              </div>
            ) : null}
          </div>
        </BottomSheet.Content>
      </BottomSheet.VirtualKeyboardProvider>
    </BottomSheet>
  );
}
