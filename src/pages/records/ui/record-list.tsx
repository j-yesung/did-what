import {
  CalendarDaysIcon,
  ChevronRightIcon,
  MapPinIcon,
  NotebookPenIcon,
  PlusIcon,
  SearchXIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

import type { getRecords } from "@/entities/record";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";

const DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "long",
  timeZone: "Asia/Seoul",
});

type RecordListItem = NonNullable<Awaited<ReturnType<typeof getRecords>>["data"]>[number];

type RecordListProps = {
  isFiltered: boolean;
  records: RecordListItem[];
};

export function RecordList({ isFiltered, records }: RecordListProps) {
  if (records.length === 0) {
    return isFiltered ? (
      <Empty className="border bg-card py-14">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>조건에 맞는 기록이 없어요</EmptyTitle>
          <EmptyDescription>검색어를 바꾸거나 기간을 넓혀 보세요.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href="/records" />} variant="outline">
            전체 기록 보기
          </Button>
        </EmptyContent>
      </Empty>
    ) : (
      <Empty className="border bg-card py-14">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <NotebookPenIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>아직 남긴 기록이 없어요</EmptyTitle>
          <EmptyDescription>함께한 오늘의 장면을 첫 기록으로 남겨보세요.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/records/new" />} nativeButton={false}>
            <PlusIcon data-icon="inline-start" />첫 기록 남기기
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <section
      className="relative flex flex-col gap-4 before:absolute before:top-9 before:bottom-4 before:left-[7px] before:w-px before:bg-border"
      aria-label={`기록 ${records.length}개`}
    >
      <p className="px-1 text-muted-foreground text-xs">
        {isFiltered ? "조건에 맞는 기록" : "최근 기록"} {records.length}개
      </p>
      {records.map((record) => (
        <article className="relative pl-5" key={record.id}>
          <span
            className="absolute top-5 left-0 size-[15px] rounded-full border-4 border-background bg-primary"
            aria-hidden="true"
          />
          <Card>
            <CardHeader>
              <CardTitle>{record.activity}</CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <CalendarDaysIcon className="size-4" aria-hidden="true" />
                {DATE_FORMATTER.format(new Date(`${record.recorded_at}T00:00:00+09:00`))}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-sm">
                <MapPinIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                {record.region_label} / {record.region_name}
              </p>
              {record.memo ? <p className="text-muted-foreground text-sm leading-relaxed">{record.memo}</p> : null}
            </CardContent>
            <CardFooter className="justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <UsersIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <p className="truncate text-muted-foreground text-xs">
                  {record.record_people.map(({ person }) => person.name).join(", ") || "함께한 사람 없음"}
                </p>
              </div>
              <Button nativeButton={false} render={<Link href={`/records/${record.id}`} />} size="sm" variant="ghost">
                기록 보기
                <ChevronRightIcon data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>
        </article>
      ))}
    </section>
  );
}
