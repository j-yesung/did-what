import { cn } from "@/shared/lib/utils";

import { normalizeRecordCategory, RECORD_CATEGORY_BADGE } from "../model/category";
import type { RecordSummary } from "../model/types";
import { RecordCardContent } from "./record-card-content";

type RecordDetailHeaderProps = {
  bleed?: boolean;
  record: Pick<
    RecordSummary,
    "activity" | "category" | "record_comments" | "record_regions" | "region_code" | "region_label"
  >;
  regionText: string;
  titleId?: string;
};

export function RecordDetailHeader({ bleed, record, regionText, titleId }: RecordDetailHeaderProps) {
  return (
    <div
      className={cn(
        "min-w-0 text-left",
        bleed
          ? "flex flex-col justify-end overflow-hidden px-4.5 pt-[calc(var(--page-top)+var(--toolbar-height)+--spacing(8))] pb-4.5"
          : "rounded-3xl p-4.5",
        RECORD_CATEGORY_BADGE[normalizeRecordCategory(record.category)],
      )}
      data-record-header=""
    >
      <RecordCardContent heading="h2" record={record} regionLabel={regionText} size="header" titleId={titleId} />
    </div>
  );
}
