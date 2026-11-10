"use client";

import { type ReactNode, useMemo } from "react";

import { CaretRightIcon } from "@phosphor-icons/react";

import { RecordDetailLink } from "@/entities/record";
import type { RegionCode } from "@/entities/region/model/region";
import { DotLandMap } from "@/entities/region/ui/dot-land";
import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ListHeader } from "@/shared/ui/list-header";
import { PressLink } from "@/shared/ui/press-link";

import {
  type HomeRecord,
  type RegionSummary,
  type RelationshipStats,
  type ThisTime,
  type TopPlace,
  toVisitPoints,
} from "../model/retrospect";

const PRESS_SURFACE = cn(PRESS_FEEDBACK, "after:hidden");

function SectionTitle({ caption, title }: { caption?: string; title: string }) {
  return (
    <h2 className="flex items-baseline justify-between px-1 font-bold text-[17px] tracking-[-0.03em]">
      {title}
      {caption && <span className="font-medium text-[12px] text-muted-foreground">{caption}</span>}
    </h2>
  );
}

function Section({ children, caption, title }: { children: ReactNode; caption?: string; title: string }) {
  return (
    <section className="flex flex-col gap-2.5">
      <SectionTitle caption={caption} title={title} />
      {children}
    </section>
  );
}

export function HomeGreeting({ greeting }: { greeting: string }) {
  return (
    <div className="pr-28">
      <ListHeader title={greeting} />
    </div>
  );
}

const formatDate = (date: string) => date.replaceAll("-", ".");

export function TogetherCard({ stats }: { stats: RelationshipStats | null }) {
  return (
    <section aria-label="함께한 시간" className="flex min-h-29.5 flex-col items-start justify-center px-1">
      {stats ? (
        <>
          <p className="font-bold text-[17px] tracking-[-0.03em]">우리가 만난 지</p>
          <p className="mt-0.5 whitespace-nowrap font-extrabold leading-[1.2] tracking-[-0.04em]">
            <span className="text-[42px] text-primary tabular-nums">{stats.daysTogether}</span>
            <span className="ml-1 text-[27px]">일째</span>
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">{formatDate(stats.metOn)}부터</p>
        </>
      ) : (
        <>
          <h2 className="max-w-57.5 text-balance font-bold text-[22px] leading-[1.4] tracking-[-0.03em]">
            우리가 만난 날은 언제인가요?
          </h2>
          <Button
            className="mt-2 px-0 text-accent-text"
            nativeButton={false}
            render={<PressLink href="/settings#met-on" />}
            size="medium"
            variant="ghost"
          >
            우리가 만난 날 등록하기
            <CaretRightIcon aria-hidden="true" data-icon="inline-end" weight="bold" />
          </Button>
        </>
      )}
    </section>
  );
}

export function ThisTimeCard({ onOpen, thisTime }: { onOpen: () => void; thisTime: ThisTime }) {
  const more = thisTime.records.length - 1;

  return (
    <button
      className={cn(
        "surface-inverse flex w-full items-center gap-3 rounded-[22px] bg-surface px-4.5 py-3.5 text-left text-foreground",
        PRESS_SURFACE,
        FOCUS_RING,
      )}
      onClick={onOpen}
      type="button"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] text-muted-foreground">{thisTime.yearsAgo}년 전 이맘때</span>
        <span className="mt-0.5 block truncate font-bold text-[15px]">
          {thisTime.record.activity}
          {more > 0 && <span className="ml-1.5 font-semibold text-muted-foreground">외 {more}건</span>}
        </span>
      </span>
    </button>
  );
}

export function AnniversaryCard({ dday, record }: { dday: number; record: HomeRecord }) {
  const [year, month, day] = record.recorded_at.split("-").map(Number);

  return (
    <RecordDetailLink
      className={cn(
        "surface-inverse flex items-center gap-3.5 rounded-[22px] border-[1.5px] border-category-anniversary/35 bg-surface px-4 py-3.5 text-foreground",
        PRESS_SURFACE,
      )}
      href={`/records/${record.id}`}
    >
      <span className="min-w-16 font-extrabold text-[22px] text-category-anniversary tabular-nums tracking-[-0.04em]">
        {dday === 0 ? (
          "D-DAY"
        ) : (
          <>
            <span className="mr-0.5 font-bold text-[12px]">D-</span>
            {dday}
          </>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-[15px]">{record.activity}</span>
        <span className="mt-0.5 block text-[12px] text-muted-foreground">
          {year}년 {month}월 {day}일 · 기념일
        </span>
      </span>
    </RecordDetailLink>
  );
}

const OVERVIEW_LIMIT = 5;
const MAP_WIDTH = 160;

type RegionOverviewProps = {
  onOpen: (code: RegionCode) => void;
  onOpenAll: () => void;
  records: HomeRecord[];
  regions: RegionSummary[];
};

export function RegionOverview({ onOpen, onOpenAll, records, regions }: RegionOverviewProps) {
  const visits = useMemo(() => toVisitPoints(records), [records]);
  const visited = regions
    .filter(({ records }) => records.length > 0)
    .sort((a, b) => b.records.length - a.records.length);

  return (
    <Section caption={`${regions.length}곳 중 ${visited.length}곳`} title="우리가 다녀온 곳">
      <div className="grid grid-cols-[minmax(0,10fr)_minmax(0,11fr)] items-center gap-5 px-1">
        <DotLandMap
          className="block h-auto w-full"
          label={`다녀온 곳 지도, ${regions.length}곳 중 ${visited.length}곳`}
          visits={visits}
          width={MAP_WIDTH}
        />
        <div className="flex flex-col">
          <ul>
            {visited.slice(0, OVERVIEW_LIMIT).map(({ code, label, records }) => (
              <li className="border-t first:border-t-0" key={code}>
                <button
                  className={cn(
                    "flex w-full items-baseline justify-between py-2.5 text-left",
                    PRESS_SURFACE,
                    FOCUS_RING,
                  )}
                  onClick={() => onOpen(code)}
                  type="button"
                >
                  <span className="font-bold text-[15px] tracking-[-0.02em]">{label}</span>
                  <span className="font-semibold text-[13px] text-muted-foreground tabular-nums">{records.length}</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            className={cn(
              "mt-1.5 self-start py-1.5 font-semibold text-[13px] text-muted-foreground",
              PRESS_SURFACE,
              FOCUS_RING,
            )}
            onClick={onOpenAll}
            type="button"
          >
            전체 {regions.length}곳 보기
          </button>
        </div>
      </div>
    </Section>
  );
}

export function TopPlaces({ places }: { places: TopPlace[] }) {
  return (
    <Section title="자주 간 곳">
      <ol>
        {places.map((place, index) => (
          <li key={place.id}>
            <PressLink
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-2xl px-1 py-2.5 after:-inset-x-2 after:inset-y-0",
                PRESS_FEEDBACK,
                FOCUS_RING,
              )}
              href={`/places/${place.id}`}
            >
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full font-extrabold text-[16px] tabular-nums",
                  index === 0 ? "bg-primary/10 text-accent-text" : "bg-muted text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-bold text-[16px] leading-[22px] tracking-[-0.03em]">
                {place.name}
              </span>
              <span className="shrink-0 font-semibold text-[13px] text-muted-foreground tabular-nums">
                {place.count}번
              </span>
            </PressLink>
          </li>
        ))}
      </ol>
    </Section>
  );
}
