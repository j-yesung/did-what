"use client";

import {
  ChatCircleIcon,
  HeartIcon,
  MapTrifoldIcon,
  NotebookIcon,
  SparkleIcon,
  UsersIcon,
} from "@phosphor-icons/react/dist/ssr";

import { normalizeRecordCategories, normalizeRecordCategory } from "../model/category";
import { formatRecordRegionLabels } from "../model/record-region";
import type { RecordSummary } from "../model/types";
import { RecordCategoryBadge } from "./record-badges";

export const RECORD_CARD_BUTTON_CLASS =
  "h-auto min-h-16 min-w-0 justify-start whitespace-normal rounded-md px-0 py-3 text-left font-normal after:hidden [&>span]:block [&>span]:w-full";

const CATEGORY_ICONS = {
  anniversary: SparkleIcon,
  daily: NotebookIcon,
  date: HeartIcon,
  gathering: UsersIcon,
  travel: MapTrifoldIcon,
  uncategorized: NotebookIcon,
};

type RecordCardContentProps = {
  record: Pick<
    RecordSummary,
    "activity" | "category" | "record_comments" | "record_regions" | "region_code" | "region_label" | "region_name"
  >;
};

export function RecordCardContent({ record }: RecordCardContentProps) {
  const regionLabel = formatRecordRegionLabels(record, Number.POSITIVE_INFINITY);
  const categories = normalizeRecordCategories(record.category);
  const Icon = CATEGORY_ICONS[normalizeRecordCategory(record.category)];
  const commentCount = record.record_comments?.[0]?.count ?? 0;

  return (
    <span className="block min-w-0">
      <span className="flex min-w-0 items-start justify-between gap-2">
        <h3 className="min-w-0 truncate font-bold text-[18px] text-foreground leading-6 tracking-[-0.03em]">
          {record.activity}
        </h3>
        <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 -rotate-12" />
      </span>
      {regionLabel ? (
        <span className="mt-1 block truncate text-[12px] text-muted-foreground leading-4">{regionLabel}</span>
      ) : null}
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
