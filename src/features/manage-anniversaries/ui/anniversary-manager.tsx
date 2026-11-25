"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ANNIVERSARIES_QUERY_KEY, anniversariesQueryOptions } from "@/entities/anniversary/api/anniversaries";
import { getFeaturedAnniversary } from "@/entities/anniversary/model/anniversary";
import { AnniversaryCard } from "@/entities/anniversary/ui/anniversary-card";
import { ListRowTexts } from "@/shared/ui/list-row";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";

import { createAnniversary, deleteAnniversary } from "../api/actions";
import { AnniversarySheet } from "./anniversary-sheet";

export function AnniversaryManager({ today }: { today: string }) {
  const query = useQuery(anniversariesQueryOptions);
  const queryClient = useQueryClient();
  if (query.isPending) return null;
  if (query.isError) {
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
    <AnniversarySheet
      anniversaries={query.data}
      today={today}
      trigger={
        featured ? (
          <AnniversaryCard {...featured} />
        ) : (
          <span className="block rounded-[22px] bg-muted px-5 py-4">
            <ListRowTexts title="기념일 등록하기" />
          </span>
        )
      }
      onCreate={async (draft) => {
        const result = await createAnniversary(draft);
        if (result.status === "success") await queryClient.invalidateQueries({ queryKey: ANNIVERSARIES_QUERY_KEY });
        return result;
      }}
      onDelete={async (id) => {
        const result = await deleteAnniversary(id);
        if (result.status === "success") await queryClient.invalidateQueries({ queryKey: ANNIVERSARIES_QUERY_KEY });
        return result;
      }}
    />
  );
}
