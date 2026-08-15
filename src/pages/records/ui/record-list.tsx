import { MagnifyingGlassMinusIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { EmptyRecords, type getRecords, RecordCard, RecordTimeline } from "@/entities/record";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";

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
            <MagnifyingGlassMinusIcon strokeWidth={2} aria-hidden="true" />
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
      <EmptyRecords title="아직 남긴 기록이 없어요" />
    );
  }

  return (
    <RecordTimeline aria-label={`기록 ${records.length}개`}>
      <p className="px-1 text-muted-foreground text-xs">
        {isFiltered ? "조건에 맞는 기록" : "최근 기록"} {records.length}개
      </p>
      {records.map((record) => (
        <RecordCard
          activity={record.activity}
          key={record.id}
          memo={record.memo}
          peopleNames={record.record_people.map(({ person }) => person.name)}
          recordId={record.id}
          recordedAt={record.recorded_at}
          region={{ label: record.region_label, name: record.region_name }}
        />
      ))}
    </RecordTimeline>
  );
}
