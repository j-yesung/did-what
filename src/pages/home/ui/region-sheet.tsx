"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { usePathname, useSearchParams } from "next/navigation";

import { RecordCard, RecordDateGroups, toRegionLocations } from "@/entities/record";
import { createRegionActivityMaps, RegionMiniMap } from "@/entities/region";
import { getRegion } from "@/entities/region/model/region";
import { cn } from "@/shared/lib/utils";
import { BottomSheet, FULL_SHEET_HEIGHT } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { ListRow } from "@/shared/ui/list-row";
import { PressLink } from "@/shared/ui/press-link";

import { openRegionSheet, REGION_PARAM, REGION_SHEET_HISTORY_KEY } from "../model/region-sheet-url";
import { countSubregions, getSubregions, type HomeRecord, type RegionSummary } from "../model/retrospect";
import styles from "./region-sheet.module.css";

const renderRecord = (record: HomeRecord) => <RecordCard record={record} />;

type RegionSheetProps = {
  records: HomeRecord[];
  regions: RegionSummary[];
};

export function RegionSheet({ records, regions }: RegionSheetProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  const code = getRegion(params?.get(REGION_PARAM) ?? "")?.code ?? null;
  const region = regions.find((summary) => summary.code === code) ?? null;
  const previous = useRef<RegionSummary | null>(null);
  if (region) previous.current = region;
  const shown = region ?? previous.current;

  const close = () => {
    if (window.history.state?.[REGION_SHEET_HISTORY_KEY]) {
      window.history.back();
      return;
    }
    const next = new URLSearchParams(params?.toString());
    next.delete(REGION_PARAM);
    const search = next.toString();
    window.history.replaceState(null, "", `${pathname}${search ? `?${search}` : ""}`);
  };

  return (
    <BottomSheet onOpenChange={(open) => !open && close()} open={region !== null} showSwipeHandle>
      <BottomSheet.Content
        className="[--bottom-sheet-content-max-height:calc(100dvh-env(safe-area-inset-top)-16px)]"
        style={{ height: FULL_SHEET_HEIGHT }}
      >
        {shown && <RegionSheetBody key={shown.code} records={records} region={shown} />}
      </BottomSheet.Content>
    </BottomSheet>
  );
}

function RegionSheetBody({ records, region }: { records: HomeRecord[]; region: RegionSummary }) {
  const [subregion, setSubregion] = useState<string | null>(null);
  const map = useMemo(
    () => createRegionActivityMaps(toRegionLocations(records)).find(({ code }) => code === region.code),
    [records, region.code],
  );
  const entries = getSubregions(region.records, region.code);
  const subregions = countSubregions(entries);
  const visible = subregion ? entries.filter(({ subregions }) => subregions.includes(subregion)) : entries;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(--spacing(6)+env(safe-area-inset-bottom))]">
      <BottomSheet.Header className="pb-1 group-data-[swipe-axis=y]/bottom-sheet-popup:text-left" glass="below">
        <div className="flex items-center gap-4">
          {map && (
            <div className="aspect-14/13 w-28 shrink-0">
              <RegionMiniMap className={styles.miniMap} label={`${region.name} 미니 지도`} map={map} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <BottomSheet.Title className="font-bold text-2xl tracking-[-0.04em]">{region.name}</BottomSheet.Title>
            {map && (
              <>
                <BottomSheet.Description className="mt-1 text-left text-[13px]">
                  {map.totalCount}곳 중 <strong className="font-semibold text-foreground">{map.visitedCount}곳</strong>{" "}
                  다녀왔어요
                </BottomSheet.Description>
                <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <i
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${(map.visitedCount / map.totalCount) * 100}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
        {subregions.length > 1 && (
          <div aria-label="시·군·구" className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">
            {[[null, entries.length] as const, ...subregions].map(([name, count]) => (
              <Chip aria-pressed={subregion === name} key={name ?? "all"} onClick={() => setSubregion(name)}>
                {name ?? "전체"} <span className="tabular-nums">{count}</span>
              </Chip>
            ))}
          </div>
        )}
      </BottomSheet.Header>
      <div className="px-5 pt-6">
        {visible.length > 0 ? (
          <RecordDateGroups records={visible.map(({ record }) => record)} renderRecord={renderRecord} />
        ) : (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyTitle className="text-muted-foreground">이 지역의 기록이 없어요</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <Button
                nativeButton={false}
                render={<PressLink href={`/records/new?region=${region.code}`} />}
                size="medium"
                variant="weak"
              >
                기록 남기기
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </div>
    </div>
  );
}

const LIST_HISTORY_KEY = "didWhatRegionListSheet";

type RegionListSheetProps = {
  onClose: () => void;
  open: boolean;
  records: HomeRecord[];
  regions: RegionSummary[];
};

export function RegionListSheet({ onClose, open, records, regions }: RegionListSheetProps) {
  useEffect(() => {
    if (!open) return;
    window.history.pushState({ [LIST_HISTORY_KEY]: true }, "");
    const handlePop = () => {
      if (!window.history.state?.[LIST_HISTORY_KEY] && !window.history.state?.[REGION_SHEET_HISTORY_KEY]) onClose();
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [open, onClose]);

  const close = () => {
    if (window.history.state?.[LIST_HISTORY_KEY]) window.history.back();
    else onClose();
  };

  return (
    <BottomSheet onOpenChange={(nextOpen) => !nextOpen && close()} open={open} showSwipeHandle>
      <BottomSheet.Content
        className="[--bottom-sheet-content-max-height:calc(100dvh-env(safe-area-inset-top)-16px)]"
        overlayHandle
        style={{ height: FULL_SHEET_HEIGHT }}
      >
        <RegionList records={records} regions={regions} />
      </BottomSheet.Content>
    </BottomSheet>
  );
}

function RegionList({ records, regions }: { records: HomeRecord[]; regions: RegionSummary[] }) {
  const maps = useMemo(() => createRegionActivityMaps(toRegionLocations(records)), [records]);
  const sorted = regions.toSorted((a, b) => b.records.length - a.records.length);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(--spacing(6)+env(safe-area-inset-bottom))]">
      <BottomSheet.Header className="pt-7" glass>
        <BottomSheet.Title className="sr-only">우리가 다녀온 곳</BottomSheet.Title>
      </BottomSheet.Header>
      <ul className="px-5 pt-10">
        {sorted.map(({ code, name, records }) => {
          const map = maps.find((item) => item.code === code);
          return (
            <li key={code}>
              <ListRow
                className="rounded-xl px-0 py-2.5 font-normal text-foreground after:-inset-x-2"
                onClick={() => openRegionSheet(code)}
                right={
                  records.length > 0 && (
                    <span className="font-semibold text-[13px] text-muted-foreground tabular-nums">
                      기록 {records.length}개
                    </span>
                  )
                }
              >
                <span className="flex items-center gap-3.5">
                  <span className={cn("aspect-14/13 w-16 shrink-0", !records.length && "opacity-60")}>
                    {map && <RegionMiniMap className={cn(styles.miniMap, "size-full")} map={map} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block font-bold text-[15px] tracking-[-0.02em]",
                        !records.length && "text-muted-foreground",
                      )}
                    >
                      {name}
                    </span>
                    {records.length > 0 && map ? (
                      <>
                        <span className="mt-0.5 block text-[12px] text-muted-foreground">
                          {map.totalCount}곳 중 {map.visitedCount}곳 다녀왔어요
                        </span>
                        <span aria-hidden="true" className="mt-1.5 block h-1 overflow-hidden rounded-full bg-muted">
                          <i
                            className="block h-full rounded-full bg-primary"
                            style={{ width: `${(map.visitedCount / map.totalCount) * 100}%` }}
                          />
                        </span>
                      </>
                    ) : (
                      <span className="mt-0.5 block text-[12px] text-muted-foreground">아직 없어요</span>
                    )}
                  </span>
                </span>
              </ListRow>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
