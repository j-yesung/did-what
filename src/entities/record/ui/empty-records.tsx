"use client";

import { NotePencilIcon } from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/shared/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { PressLink } from "@/shared/ui/press-link";

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
        <Button nativeButton={false} render={<PressLink href="/records/new" />} size="medium">
          기록 남기기
        </Button>
      </EmptyContent>
    </Empty>
  );
}
