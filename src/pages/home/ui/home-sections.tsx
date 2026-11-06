"use client";

import { Fragment, type ReactNode, useMemo } from "react";

import { RecordDetailLink } from "@/entities/record";
import type { RegionCode } from "@/entities/region/model/region";
import { DotLandMap } from "@/entities/region/ui/dot-land";
import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
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
    <header className="flex min-h-13 items-center px-1 pr-28">
      <h1 className="font-bold text-2xl tracking-[-0.04em]">{greeting}</h1>
    </header>
  );
}

const formatDate = (date: string) => date.replaceAll("-", ".");

function TogetherFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate font-bold text-[15px] tabular-nums tracking-[-0.02em]">{value}</dd>
    </div>
  );
}

export function TogetherCard({ stats }: { stats: RelationshipStats }) {
  return (
    <section
      aria-label="함께한 시간"
      className="surface-inverse relative overflow-hidden rounded-3xl bg-surface px-5.5 pt-5.5 pb-5 text-foreground"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 size-44 rounded-full bg-[radial-gradient(circle_at_30%_30%,color-mix(in_srgb,var(--foreground)_14%,transparent),transparent_60%)]"
      />
      <p className="font-bold text-xl tracking-[-0.03em]">우리는 지금</p>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="font-extrabold text-[56px] leading-none tracking-[-0.03em]">{stats.daysTogether}</span>
        <span className="font-bold text-xl tracking-[-0.03em]">일 됐어</span>
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-3">
        <TogetherFact label="첫 기록" value={formatDate(stats.firstDate)} />
        <TogetherFact label="마지막 기록" value={stats.daysSinceLast ? `${stats.daysSinceLast}일 전` : "오늘"} />
      </dl>
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

const INLINE_LINK = cn(
  "rounded-sm font-semibold text-foreground underline decoration-border underline-offset-4 active:opacity-60",
  FOCUS_RING,
);

export function TopPlaces({ places: [top, ...rest], today }: { places: TopPlace[]; today: string }) {
  const [year, month, day] = top.last.recorded_at.split("-").map(Number);
  const lastDate = `${top.last.recorded_at.startsWith(today.slice(0, 4)) ? "" : `${year}년 `}${month}월 ${day}일`;

  return (
    <Section title="자주 간 곳">
      <div className="flex flex-col px-1">
        <PressLink
          className={cn(
            "self-start rounded-sm font-extrabold text-[26px] leading-tight tracking-[-0.04em]",
            FOCUS_RING,
          )}
          href={`/places/${top.id}`}
        >
          {top.name}
        </PressLink>
        <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
          총 <strong className="font-bold text-foreground">{top.count}번</strong> 다녀왔어요
          <br />
          마지막은 {lastDate},{" "}
          <RecordDetailLink className={INLINE_LINK} href={`/records/${top.last.id}`}>
            {top.last.activity}
          </RecordDetailLink>
        </p>
        {rest.length > 0 && (
          <p className="mt-4 text-[14px] text-muted-foreground leading-[1.9]">
            그다음은{" "}
            {rest.map((place, index) => (
              <Fragment key={place.id}>
                {index > 0 && ", "}
                <PressLink className={INLINE_LINK} href={`/places/${place.id}`}>
                  {place.name}
                </PressLink>{" "}
                {place.count}번
              </Fragment>
            ))}
            이에요
          </p>
        )}
      </div>
    </Section>
  );
}
