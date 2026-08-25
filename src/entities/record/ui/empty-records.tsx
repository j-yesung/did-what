import { NotePencilIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { Button } from "@/shared/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";

type EmptyRecordsProps = {
  actionLabel?: string;
  description?: string;
  title: string;
};

// 기록이 하나도 없을 때. 어느 화면에서 마주쳐도 다음 행동은 기록 남기기로 같다.
export function EmptyRecords({
  actionLabel = "첫 기록 남기기",
  description = "함께한 오늘의 장면을 첫 기록으로 남겨보세요.",
  title,
}: EmptyRecordsProps) {
  return (
    <Empty className="border bg-card py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <NotePencilIcon strokeWidth={2} aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button nativeButton={false} render={<Link href="/records/new" />}>
          {actionLabel}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
