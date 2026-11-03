"use client";

import type { RecordSummary } from "../model/types";
import { RecordCard } from "./record-card";
import { RecordDateGroups } from "./record-date-groups";

type RecordTimelineItemsProps = {
  records: readonly RecordSummary[];
  onDetailPrefetch?: (recordId: string) => void;
};

export function RecordTimelineItems({ records, onDetailPrefetch }: RecordTimelineItemsProps) {
  return (
    <RecordDateGroups
      records={records}
      renderRecord={(record) => <RecordCard onDetailPrefetch={onDetailPrefetch} record={record} />}
    />
  );
}
