import type { ReactNode } from "react";

import { getToday } from "@/shared/lib/date/get-today";

import { formatRecordTimelineDate, groupRecordsByDate } from "../model/record-timeline";

type RecordDateGroupsProps<T> = {
  records: readonly T[];
  renderRecord: (record: T) => ReactNode;
};

export function RecordDateGroups<T extends { id: string; recorded_at: string }>({
  records,
  renderRecord,
}: RecordDateGroupsProps<T>) {
  const groups = groupRecordsByDate(records);
  const thisYear = getToday().slice(0, 4);

  return (
    <div className="space-y-5">
      {groups.map(({ date, records }, index) => (
        <section key={date} aria-label={formatRecordTimelineDate(date)}>
          {date.slice(0, 4) !== thisYear && date.slice(0, 4) !== groups[index - 1]?.date.slice(0, 4) && (
            <p className="mt-0.5 mb-5.5 flex items-center gap-2.5 font-semibold text-[13px] text-muted-foreground tabular-nums after:h-px after:flex-1 after:bg-border">
              {date.slice(0, 4)}년
            </p>
          )}
          <h2 className="font-semibold text-[12px] text-muted-foreground">
            <time dateTime={date}>{formatRecordTimelineDate(date)}</time>
          </h2>
          <ul>
            {records.map((record) => (
              <li key={record.id}>{renderRecord(record)}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
