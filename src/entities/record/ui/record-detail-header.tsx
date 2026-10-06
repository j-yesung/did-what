import { HeartIcon, MapTrifoldIcon, NotebookIcon, SparkleIcon, UsersIcon } from "@phosphor-icons/react/dist/ssr";

import { formatRecordPeriod } from "@/shared/lib/date/format-date";
import { cn } from "@/shared/lib/utils";

import { normalizeRecordCategory, RECORD_CATEGORY_BADGE } from "../model/category";
import type { RecordSummary } from "../model/types";
import { RecordBadges } from "./record-badges";

const CATEGORY_ICONS = {
  anniversary: SparkleIcon,
  daily: NotebookIcon,
  date: HeartIcon,
  gathering: UsersIcon,
  travel: MapTrifoldIcon,
  uncategorized: NotebookIcon,
};

type RecordDetailHeaderProps = {
  heading?: "h1" | "h2" | "h3";
  record: Pick<RecordSummary, "activity" | "category" | "weather" | "recorded_at" | "recorded_until">;
  regionText: string;
  titleId?: string;
};

export function RecordDetailHeader({ heading: Heading = "h2", record, regionText, titleId }: RecordDetailHeaderProps) {
  const category = normalizeRecordCategory(record.category);
  const Icon = CATEGORY_ICONS[category];
  return (
    <div
      className={cn(
        "w-full min-w-0 rounded-3xl p-6",
        RECORD_CATEGORY_BADGE[category],
        category === "travel" && "bg-secondary",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Heading
          className="min-w-0 text-balance font-bold text-3xl text-foreground leading-tight tracking-[-0.045em]"
          id={titleId}
        >
          {record.activity}
        </Heading>
        <span aria-hidden="true" className="flex size-9 shrink-0 -rotate-12 items-center justify-center">
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-2.5 text-muted-foreground text-sm">
        {formatRecordPeriod(record.recorded_at, record.recorded_until)}
      </p>
      {regionText ? <p className="mt-1 break-keep text-sm">{regionText}</p> : null}
      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        <RecordBadges className="px-2 py-1" record={record} />
      </div>
    </div>
  );
}
