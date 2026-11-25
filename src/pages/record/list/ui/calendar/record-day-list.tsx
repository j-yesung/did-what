"use client";

import { useQueryClient } from "@tanstack/react-query";
import { parseISO } from "date-fns";

import { RecordCard, type RecordSummary } from "@/entities/record";
import { recordCommentListQueryOptions } from "@/entities/record-comment";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { PressLink } from "@/shared/ui/press-link";

const DAY_TITLE = new Intl.DateTimeFormat("ko-KR", { day: "numeric", month: "long", weekday: "long" });

type RecordDayListProps = {
  anniversaryNames?: readonly string[];
  date: string;
  records: readonly RecordSummary[] | undefined;
};

export function RecordDayList({ anniversaryNames, date, records }: RecordDayListProps) {
  const queryClient = useQueryClient();

  const prefetchComments = (recordId: string) =>
    void queryClient.prefetchInfiniteQuery(recordCommentListQueryOptions(recordId));

  return (
    <section
      aria-label="선택한 날의 기록"
      className="mt-1 min-h-0 flex-1 overflow-y-auto overscroll-contain border-t pt-3"
    >
      <header className="flex items-center justify-between gap-3 pb-2 pl-1">
        <h3 className="font-bold text-lg leading-7">{DAY_TITLE.format(parseISO(date))}</h3>
        <Button nativeButton={false} render={<PressLink href={`/records/new?date=${date}`} prefetch />} variant="weak">
          기록 남기기
        </Button>
      </header>

      {anniversaryNames && anniversaryNames.length > 0 && (
        <p className="px-1 pb-2 font-semibold text-accent-text text-sm">
          <span className="sr-only">기념일: </span>
          {anniversaryNames.join(" · ")}
        </p>
      )}

      {records ? (
        records.length > 0 ? (
          <ul>
            {records.map((record) => (
              <li key={record.id}>
                <RecordCard onDetailPrefetch={prefetchComments} record={record} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyTitle className="text-muted-foreground">이날 남긴 기록이 없어요</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )
      ) : null}
    </section>
  );
}
