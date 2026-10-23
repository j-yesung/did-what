"use client";

import { Fragment } from "react";

import { cn } from "@/shared/lib/utils";

import { formatRecordTimelineMonth, getRecordTimelineItemState } from "../model/record-timeline";
import type { RecordSummary } from "../model/types";
import { RecordCard } from "./record-card";

type RecordTimelineItemsProps = {
  records: readonly RecordSummary[];
  onDetailPrefetch?: (recordId: string) => void;
};

export function RecordTimelineItems({ records, onDetailPrefetch }: RecordTimelineItemsProps) {
  return (
    <>
      {records.map((record, index) => {
        const { startsMonth } = getRecordTimelineItemState(records, index);
        const endsMonth = record.recorded_at.slice(0, 7) !== records[index + 1]?.recorded_at.slice(0, 7);

        return (
          <Fragment key={record.id}>
            {startsMonth ? (
              <p
                className={cn(
                  "pb-6 font-semibold text-[17px] tracking-tight",
                  index > 0 && "mt-6 border-border border-t border-dashed pt-7",
                )}
              >
                {formatRecordTimelineMonth(record.recorded_at)}
              </p>
            ) : null}
            <RecordCard endsMonth={endsMonth} onDetailPrefetch={onDetailPrefetch} record={record} />
          </Fragment>
        );
      })}
    </>
  );
}
