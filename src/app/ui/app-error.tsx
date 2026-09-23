"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";

import { Button, buttonVariants } from "@/shared/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { PageShell } from "@/shared/ui/layouts";
import { PressLink } from "@/shared/ui/press-link";

export function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageShell className="items-center justify-center" withBottomNavigation>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WarningCircleIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>화면을 불러오지 못했어요</EmptyTitle>
          <EmptyDescription>잠시 후 다시 시도하거나 지도로 돌아가 주세요.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center">
          <Button onClick={reset} size="medium" type="button" variant="outline">
            다시 시도
          </Button>
          <PressLink className={buttonVariants({ size: "medium" })} href="/">
            지도로 가기
          </PressLink>
        </EmptyContent>
      </Empty>
    </PageShell>
  );
}
