import { NotePencilIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { buttonVariants } from "@/shared/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";

type EmptyRecordsProps = {
  description?: string;
  title: string;
};

export function EmptyRecords({ description, title }: EmptyRecordsProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <NotePencilIcon strokeWidth={2} aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      <EmptyContent>
        <Link className={buttonVariants({ size: "medium" })} href="/records/new">
          기록 남기기
        </Link>
      </EmptyContent>
    </Empty>
  );
}
