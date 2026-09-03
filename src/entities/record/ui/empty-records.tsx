"use client";

import { NotePencilIcon } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";

type EmptyRecordsProps = {
  description?: string;
  title: string;
};

export function EmptyRecords({ description, title }: EmptyRecordsProps) {
  const router = useRouter();

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
        <Button onClick={() => router.push("/records/new")} size="medium" type="button">
          기록 남기기
        </Button>
      </EmptyContent>
    </Empty>
  );
}
