import { NotebookPenIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/shared/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";

type EmptyRecordsProps = {
  description?: string;
  title: string;
};

// 기록이 하나도 없을 때. 어느 화면에서 마주쳐도 다음 행동은 "첫 기록 남기기"로 같다.
export function EmptyRecords({
  description = "함께한 오늘의 장면을 첫 기록으로 남겨보세요.",
  title,
}: EmptyRecordsProps) {
  return (
    <Empty className="border bg-card py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <NotebookPenIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button nativeButton={false} render={<Link href="/records/new" />}>
          <PlusIcon data-icon="inline-start" />첫 기록 남기기
        </Button>
      </EmptyContent>
    </Empty>
  );
}
