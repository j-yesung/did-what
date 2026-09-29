"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";

import { Button, buttonVariants } from "@/shared/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { PageShell } from "@/shared/ui/layouts";
import { PressLink } from "@/shared/ui/press-link";

// reset은 화면만 다시 그려 서버에서 난 오류는 그대로 다시 난다. retry는 서버 데이터까지 다시 받는다.
export function AppError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
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
          <Button onClick={retry} size="medium" type="button" variant="outline">
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
