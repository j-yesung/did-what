"use client";

import { useMemo, useState } from "react";

import { CaretRightIcon } from "@phosphor-icons/react";
import { format, parseISO } from "date-fns";

import { getRegionCode, type Region } from "@/entities/region";
import { cn } from "@/shared/lib/utils";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { PressLink } from "@/shared/ui/press-link";
import { Separator } from "@/shared/ui/separator";

import { getSubregionName, type MapRecord } from "../model/record-map-points";

// 공용 시트는 화면에서 띄워 두지만, 지도 위 시트는 양옆과 하단에 붙여 지도의 일부처럼 보이게 한다.
const ATTACHED_SHEET_CLASS_NAME =
  "data-[swipe-axis=y]:max-h-[75dvh] data-[swipe-axis=y]:[--drawer-bleed-background:var(--color-popover)] data-[swipe-axis=y]:[--drawer-inline-inset:0px] data-[swipe-axis=y]:[--drawer-inset:0px] data-[swipe-direction=down]:rounded-t-3xl data-[swipe-direction=down]:rounded-b-none data-[swipe-direction=down]:border-x-0 data-[swipe-direction=down]:border-b-0";

type RegionRecordsBottomSheetProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  records: readonly MapRecord[];
  region: Region | null;
};

export function RegionRecordsBottomSheet({ onOpenChange, open, records, region }: RegionRecordsBottomSheetProps) {
  // 다른 시·도를 열면 이전 시·도에서 고른 시·군·구는 무시한다.
  const [subregionFilter, setSubregionFilter] = useState<{ regionCode: string; name: string } | null>(null);
  const selectedSubregion = region && subregionFilter?.regionCode === region.code ? subregionFilter.name : null;
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
    <BottomSheet onOpenChange={onOpenChange} open={open} showSwipeHandle>
      <BottomSheet.Content className={ATTACHED_SHEET_CLASS_NAME}>
        <BottomSheet.Header className="px-5 text-left group-data-[swipe-axis=y]/bottom-sheet-popup:text-left">
          <BottomSheet.Title className="truncate font-bold text-xl leading-7">{region?.name}</BottomSheet.Title>
          <p className="text-muted-foreground text-sm tabular-nums">기록 {regionRecords.length}개</p>
        </BottomSheet.Header>

        {subregionCounts.length > 0 ? (
          <div
            aria-label="시·군·구"
            className="flex shrink-0 gap-2 overflow-x-auto px-5 pt-3 pb-1 [scrollbar-width:none]"
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
                onClick={() => setSubregionFilter(name && region ? { name, regionCode: region.code } : null)}
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

        {region ? (
          <BottomSheet.Footer className="px-5 pt-3 pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
            <Button fullWidth nativeButton={false} render={<PressLink href={`/regions/${region.code}`} />} size="large">
              {region.name} 기록 전체 보기
            </Button>
          </BottomSheet.Footer>
        ) : null}
      </BottomSheet.Content>
    </BottomSheet>
  );
}
