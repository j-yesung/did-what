"use client";

import type { ReactNode } from "react";

import { ChatCircleIcon } from "@phosphor-icons/react";

import { getToday } from "@/shared/lib/date/get-today";

import { formatRecordRegionLabels } from "../model/record-region";
import { formatRecordRelativeDay, formatRecordTimelineDate, getRecordDateMark } from "../model/record-timeline";
import type { RecordSummary } from "../model/types";
import { RecordCategoryBadge } from "./record-badges";

export const RECORD_CARD_BUTTON_CLASS =
  "h-auto min-h-18 min-w-0 justify-start whitespace-normal rounded-md p-0 text-left font-normal after:hidden [&>span]:block [&>span]:w-full";

export function RecordCardFrame({ children }: { children: ReactNode }) {
  return <article className="min-w-0 pb-6">{children}</article>;
}

type RecordCardContentProps = {
  record: Pick<
    RecordSummary,
    | "activity"
    | "category"
    | "record_comments"
    | "record_places"
    | "record_regions"
    | "recorded_at"
    | "recorded_until"
    | "region_code"
    | "region_label"
  > & { memo?: string | null };
  showMemo?: boolean;
};

const TRAIL_LINE = <i className="h-[1.5px] w-3 shrink-0 bg-foreground/55" />;
const TRAIL_STOP = "min-w-0 max-w-[44%] truncate px-1.5";

function RecordTrail({ places, regionLabels }: { places: string[]; regionLabels: string }) {
  if (!places.length && !regionLabels) return null;
  const shown = places.length > 2 ? [places[0], null, places.at(-1)] : places;

  return (
    <>
      <span aria-hidden="true" className="mt-2 flex min-w-0 items-center text-[12.5px] leading-5">
        <i className="size-2 shrink-0 rounded-full border-[1.5px] border-foreground" />
        {places.length ? (
          shown.map((name, index) =>
            name === null ? (
              <span className="contents" key="more">
                {TRAIL_LINE}
                <span className="mx-0.5 shrink-0 rounded-full border border-foreground/25 px-1.75 text-[11px] text-muted-foreground tabular-nums">
                  +{places.length - 2}
                </span>
              </span>
            ) : (
              <span className="contents" key={`${index}:${name}`}>
                {TRAIL_LINE}
                {index === shown.length - 1 ? (
                  <i className="size-2.25 shrink-0 rounded-full bg-primary ring-3 ring-primary/20" />
                ) : (
                  <i className="size-1.5 shrink-0 rounded-full bg-foreground" />
                )}
                <span className={TRAIL_STOP}>{name}</span>
              </span>
            ),
          )
        ) : (
          <span className={TRAIL_STOP}>{regionLabels}</span>
        )}
      </span>
      <span className="sr-only">
        {places.length ? `방문 장소 ${places.length}곳: ${places.join(", ")}` : regionLabels}
      </span>
    </>
  );
}

export function RecordCardContent({ record, showMemo = true }: RecordCardContentProps) {
  const commentCount = record.record_comments?.[0]?.count ?? 0;
  const places = record.record_places?.flatMap(({ place }) => (place ? [place.name] : [])) ?? [];
  const mark = getRecordDateMark(record.recorded_at, record.recorded_until);

  return (
    <span className="flex min-w-0 gap-4">
      <time className="block w-12 shrink-0 text-center" dateTime={record.recorded_at}>
        <span aria-hidden="true" className="block font-bold text-[26px] tabular-nums leading-none tracking-[-0.04em]">
          {mark.day}
        </span>
        <span aria-hidden="true" className="mt-1.5 block whitespace-nowrap text-[11px] text-muted-foreground">
          {mark.label}
        </span>
        <span className="sr-only">{formatRecordTimelineDate(record.recorded_at, record.recorded_until)}</span>
      </time>
      <span className="block min-w-0 flex-1">
        <h3 className="min-w-0 break-words font-semibold text-[17px] leading-snug tracking-[-0.025em]">
          {record.activity}
        </h3>
        {showMemo && record.memo?.trim() ? (
          <p className="mt-1 line-clamp-2 break-words text-[13px] text-dark-weak-foreground leading-relaxed">
            {record.memo}
          </p>
        ) : null}
        <RecordTrail places={places} regionLabels={formatRecordRegionLabels(record)} />
        <span className="mt-2 flex min-w-0 items-center justify-between gap-2 text-muted-foreground text-xs">
          <span className="flex min-w-0 flex-wrap items-center gap-1">
            <RecordCategoryBadge category={record.category} />
            <span className="ml-0.5">
              {formatRecordRelativeDay(record.recorded_until ?? record.recorded_at, getToday())}
            </span>
          </span>
          {commentCount > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] tabular-nums">
              <ChatCircleIcon className="size-4" aria-hidden="true" />
              <span className="sr-only">댓글</span>
              {commentCount}
            </span>
          ) : null}
        </span>
      </span>
    </span>
  );
}
