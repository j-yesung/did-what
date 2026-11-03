"use client";

import type { ReactNode } from "react";

import { ChatCircleIcon } from "@phosphor-icons/react";

import { normalizeRecordCategories } from "../model/category";
import { formatRecordRegionLabels } from "../model/record-region";
import { formatRecordTimelineDate } from "../model/record-timeline";
import type { RecordSummary } from "../model/types";
import { RecordCategoryBadge } from "./record-badges";

export const RECORD_CARD_BUTTON_CLASS =
  "h-auto min-h-16 min-w-0 justify-start whitespace-normal rounded-md px-0 py-3 text-left font-normal after:hidden [&>span]:block [&>span]:w-full";

export function RecordCardFrame({ children }: { children: ReactNode }) {
  return <article className="min-w-0 border-border border-b">{children}</article>;
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
  >;
  regionLabel?: string;
};

export function RecordCardContent({
  record,
  regionLabel = formatRecordRegionLabels(record, 1),
}: RecordCardContentProps) {
  const places = (record.record_places ?? []).flatMap(({ place }) => (place ? [place.name] : []));
  const categories = normalizeRecordCategories(record.category);
  const commentCount = record.record_comments?.[0]?.count ?? 0;

  return (
    <span className="block min-w-0">
      <h3 className="min-w-0 truncate font-semibold text-[14px] leading-5 tracking-[-0.025em]">{record.activity}</h3>
      <span className="mt-1 flex min-w-0 items-center gap-1 text-[12px] text-muted-foreground leading-4">
        <span className="truncate">
          {regionLabel}
          {places.length > 0 && `${regionLabel ? " · " : ""}${places[0]}`}
        </span>
        {places.length > 1 && <span className="shrink-0 text-accent">외 {places.length - 1}곳</span>}
      </span>
      {record.recorded_until && record.recorded_until !== record.recorded_at && (
        <span className="mt-1 block text-[11px] text-muted-foreground">
          {formatRecordTimelineDate(record.recorded_at, record.recorded_until)}
        </span>
      )}
      {(categories.length > 0 || commentCount > 0) && (
        <span className="mt-1.5 flex min-w-0 items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1">
            <RecordCategoryBadge category={categories.slice(0, 2)} className="text-[10px]" />
            {categories.length > 2 && (
              <span
                className="text-[10px] text-muted-foreground"
                aria-label={`태그 ${categories.length - 2}개 더 있음`}
              >
                +{categories.length - 2}
              </span>
            )}
          </span>
          {commentCount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] text-muted-foreground tabular-nums">
              <ChatCircleIcon className="size-4" aria-hidden="true" />
              <span className="sr-only">댓글</span>
              {commentCount}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
