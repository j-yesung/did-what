"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { usePathname, useSearchParams } from "next/navigation";

import { RecordCard, RecordDateGroups, toRegionLocations } from "@/entities/record";
import { createRegionActivityMaps, RegionMiniMap } from "@/entities/region";
import { getRegion } from "@/entities/region/model/region";
import { cn } from "@/shared/lib/utils";
import { BottomSheet, FULL_SHEET_HEIGHT } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
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
    <>
      <BottomSheet.Header className="flex-row items-center gap-4 group-data-[swipe-axis=y]/bottom-sheet-popup:text-left">
        {map && (
          <div className="aspect-14/13 w-22 shrink-0">
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
      </BottomSheet.Header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-[calc(--spacing(6)+env(safe-area-inset-bottom))]">
        {subregions.length > 1 && (
          <div aria-label="시·군·구" className="-mr-5 mb-4 flex gap-2 overflow-x-auto pr-5 [scrollbar-width:none]">
            {[[null, entries.length] as const, ...subregions].map(([name, count]) => (
              <button
                aria-pressed={subregion === name}
                className="shrink-0 whitespace-nowrap rounded-full bg-muted px-3 py-1.5 font-semibold text-[13px] text-muted-foreground aria-pressed:bg-foreground aria-pressed:text-background"
                key={name ?? "all"}
                onClick={() => setSubregion(name)}
                type="button"
              >
                {name ?? "전체"} <span className="tabular-nums">{count}</span>
              </button>
            ))}
          </div>
        )}
        {visible.length > 0 ? (
          <RecordDateGroups records={visible.map(({ record }) => record)} renderRecord={renderRecord} />
        ) : (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-muted-foreground text-sm">이 지역의 기록이 없어요.</p>
            <Button
              nativeButton={false}
              render={<PressLink href={`/records/new?region=${region.code}`} />}
              size="medium"
              variant="weak"
            >
              기록 남기기
            </Button>
          </div>
        )}
      </div>
    </>
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
  const visited = regions.filter(({ records }) => records.length > 0).length;

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
        style={{ height: FULL_SHEET_HEIGHT }}
      >
        <BottomSheet.Header className="group-data-[swipe-axis=y]/bottom-sheet-popup:text-left">
          <BottomSheet.Title className="font-bold text-xl tracking-[-0.03em]">우리가 다녀온 곳</BottomSheet.Title>
          <BottomSheet.Description className="text-left text-[13px]">
            {regions.length}곳 중 <strong className="font-semibold text-foreground">{visited}곳</strong>
          </BottomSheet.Description>
        </BottomSheet.Header>
        <RegionList records={records} regions={regions} />
      </BottomSheet.Content>
    </BottomSheet>
  );
}

function RegionList({ records, regions }: { records: HomeRecord[]; regions: RegionSummary[] }) {
  const maps = useMemo(() => createRegionActivityMaps(toRegionLocations(records)), [records]);
  const sorted = regions.toSorted((a, b) => b.records.length - a.records.length);

  return (
    <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-[calc(--spacing(6)+env(safe-area-inset-bottom))]">
      {sorted.map(({ code, name, records }) => {
        const map = maps.find((item) => item.code === code);
        return (
          <li className="border-t first:border-t-0" key={code}>
            <button
              className="flex w-full items-center gap-3.5 py-2.5 text-left"
              onClick={() => openRegionSheet(code)}
              type="button"
            >
              <span className={cn("aspect-14/13 w-12 shrink-0", !records.length && "opacity-60")}>
                {map && <RegionMiniMap className={styles.miniMap} map={map} />}
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
              {records.length > 0 && (
                <span className="shrink-0 font-semibold text-[13px] text-muted-foreground tabular-nums">
                  {records.length}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
