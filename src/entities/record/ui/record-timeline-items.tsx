"use client";

import { useState } from "react";

import type { RecordSummary } from "../model/types";
import { RecordCard } from "./record-card";
import { RecordDateGroups } from "./record-date-groups";

type RecordTimelineItemsProps = {
  records: readonly RecordSummary[];
  onDetailPrefetch?: (recordId: string) => void;
};

export function RecordTimelineItems({ records, onDetailPrefetch }: RecordTimelineItemsProps) {
  const [initialIds] = useState(() => new Set(records.map((record) => record.id)));

  return (
    <RecordDateGroups
      records={records}
      renderRecord={(record) => (
        <RecordCard
          className={
            initialIds.has(record.id)
              ? undefined
              : "motion-safe:animate-[list-append-enter_280ms_cubic-bezier(0.2,0,0,1)_both]"
          }
          onDetailPrefetch={onDetailPrefetch}
          record={record}
        />
      )}
    />
  );
}
