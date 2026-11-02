"use client";

import type { ReactNode } from "react";

import { ChatCircleIcon } from "@phosphor-icons/react";

import { cn } from "@/shared/lib/utils";

import { normalizeRecordCategory, RECORD_CATEGORY_DOT } from "../model/category";
import { formatRecordRegionLabels } from "../model/record-region";
import { formatRecordTimelineDate } from "../model/record-timeline";
import type { RecordSummary } from "../model/types";
import { RecordCategoryBadge } from "./record-badges";

export const RECORD_CARD_BUTTON_CLASS =
  "h-auto min-h-18 min-w-0 justify-start whitespace-normal rounded-md p-0 text-left font-normal after:hidden [&>span]:block [&>span]:w-full";

type RecordCardFrameProps = {
  category: RecordSummary["category"];
  children: ReactNode;
  endsMonth?: boolean;
  /** 점 둘레의 색. 카드가 놓인 배경색과 같아야 점 뒤의 세로선이 가려진다. */
  ringClassName?: string;
};

export function RecordCardFrame({
  category,
  children,
  endsMonth = false,
  ringClassName = "ring-background",
}: RecordCardFrameProps) {
  return (
    <article className="relative ml-1.5 min-w-0 border-border border-l pb-7 pl-5">
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1.5 -left-px z-10 size-2.25 -translate-x-1/2 rounded-full ring-3",
          RECORD_CATEGORY_DOT[normalizeRecordCategory(category)],
          ringClassName,
        )}
      />
      {endsMonth ? (
        <span
          aria-hidden="true"
          className="absolute bottom-0 -left-px size-1.5 -translate-x-1/2 rounded-full bg-border"
        />
      ) : null}
      {children}
    </article>
  );
}

type RecordCardContentProps = {
  record: Pick<
    RecordSummary,
    | "activity"
    | "category"
    | "record_comments"
    | "record_regions"
    | "recorded_at"
    | "recorded_until"
    | "region_code"
    | "region_label"
  > & { memo?: string | null };
  showMemo?: boolean;
};

export function RecordCardContent({ record, showMemo = true }: RecordCardContentProps) {
  const commentCount = record.record_comments?.[0]?.count ?? 0;
  const regionLabels = formatRecordRegionLabels(record);

  return (
    <span className="block min-w-0">
      <time
        className="mb-1 block text-muted-foreground text-xs tabular-nums leading-normal"
        dateTime={record.recorded_at}
      >
        {formatRecordTimelineDate(record.recorded_at, record.recorded_until)}
      </time>
      <h3 className="min-w-0 break-words font-semibold text-[17px] leading-normal tracking-[-0.025em]">
        {record.activity}
      </h3>
      {showMemo && record.memo?.trim() ? (
        <p className="mt-1.5 line-clamp-2 break-words text-[13px] text-dark-weak-foreground leading-relaxed">
          {record.memo}
        </p>
      ) : null}
      {regionLabels ? (
        <p className="mt-1.5 break-words text-muted-foreground text-xs leading-relaxed">{regionLabels}</p>
      ) : null}
      <span className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 text-muted-foreground text-xs">
        <span className="flex flex-wrap items-center gap-1">
          <RecordCategoryBadge category={record.category} />
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
  );
}
