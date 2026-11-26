"use client";

import { useQuery } from "@tanstack/react-query";

import { anniversariesQueryOptions } from "@/entities/anniversary/api/anniversaries";
import { getFeaturedAnniversary } from "@/entities/anniversary/model/anniversary";
import { AnniversaryCard } from "@/entities/anniversary/ui/anniversary-card";
import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { ListRowTexts } from "@/shared/ui/list-row";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { PressLink } from "@/shared/ui/press-link";

export function HomeAnniversaryCard({ today }: { today: string }) {
  const query = useQuery(anniversariesQueryOptions);
  if (!query.data) {
    if (!query.isError) return null;
    return (
      <LoadErrorAlert
        title="기념일을 불러오지 못했어요"
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  }

  const featured = getFeaturedAnniversary(query.data, today);
  return (
    <PressLink className={cn("block rounded-[22px]", PRESS_FEEDBACK, FOCUS_RING)} href="/anniversaries" prefetch>
      {featured ? (
        <AnniversaryCard {...featured} />
      ) : (
        <span className="block rounded-[22px] bg-muted px-5 py-4">
          <ListRowTexts title="기념일 등록하기" />
        </span>
      )}
      <span className="sr-only"> 기념일 관리 열기</span>
    </PressLink>
  );
}
