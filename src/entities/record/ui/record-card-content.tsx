"use client";

import {
  AirplaneTiltIcon,
  CakeIcon,
  ChatCircleIcon,
  CoffeeIcon,
  HeartIcon,
  NotePencilIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/shared/lib/utils";

import {
  getRecordCategoryLabel,
  normalizeRecordCategories,
  RECORD_CATEGORY_FILL,
  type RecordCategory,
} from "../model/category";
import { formatRecordProvinceLabels } from "../model/record-region";
import type { RecordSummary } from "../model/types";

export const RECORD_CARD_BUTTON_CLASS =
  "h-auto min-h-16 min-w-0 justify-start whitespace-normal rounded-md px-0 py-3 text-left font-normal after:-inset-x-2 after:inset-y-0 [&>span]:block [&>span]:w-full";

const CATEGORY_ICON: Record<RecordCategory, { Icon: typeof HeartIcon; color: string }> = {
  anniversary: { Icon: CakeIcon, color: "text-category-anniversary" },
  daily: { Icon: CoffeeIcon, color: "text-category-daily" },
  date: { Icon: HeartIcon, color: "text-category-date" },
  gathering: { Icon: UsersThreeIcon, color: "text-category-gathering" },
  travel: { Icon: AirplaneTiltIcon, color: "text-category-travel" },
  uncategorized: { Icon: NotePencilIcon, color: "text-category-uncategorized" },
};

type RecordCardContentProps = {
  record: Pick<
    RecordSummary,
    "activity" | "category" | "record_comments" | "record_regions" | "region_code" | "region_label" | "region_name"
  >;
};

export function RecordCardContent({ record }: RecordCardContentProps) {
  const categories = normalizeRecordCategories(record.category);
  const commentCount = record.record_comments?.[0]?.count ?? 0;
  const iconCategory = categories[0] ?? "uncategorized";
  const { Icon, color } = CATEGORY_ICON[iconCategory];
  const detail = [formatRecordProvinceLabels(record), ...categories.map(getRecordCategoryLabel)]
    .filter(Boolean)
    .join(" · ");

  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full",
          RECORD_CATEGORY_FILL[iconCategory],
          color,
        )}
      >
        <Icon className="size-5" weight="fill" aria-hidden="true" />
      </span>
      <span className="block min-w-0 flex-1">
        <h3 className="min-w-0 truncate font-bold text-[16px] text-foreground leading-[22px] tracking-[-0.03em]">
          {record.activity}
        </h3>
        {(detail || commentCount > 0) && (
          <span className="mt-0.5 flex min-w-0 items-center justify-between gap-2">
            <span className="min-w-0 truncate text-[12px] text-muted-foreground leading-4">{detail}</span>
            {commentCount > 0 && (
              <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] text-muted-foreground tabular-nums">
                <ChatCircleIcon className="size-4" aria-hidden="true" />
                <span className="sr-only">댓글</span>
                {commentCount}
              </span>
            )}
          </span>
        )}
      </span>
    </span>
  );
}
