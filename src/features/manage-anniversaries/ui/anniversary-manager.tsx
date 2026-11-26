"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ANNIVERSARIES_QUERY_KEY, anniversariesQueryOptions } from "@/entities/anniversary/api/anniversaries";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { Spinner } from "@/shared/ui/spinner";

import { createAnniversary, deleteAnniversary } from "../api/actions";
import { AnniversaryManagement } from "./anniversary-management";

export function AnniversaryManager({ today }: { today: string }) {
  const query = useQuery(anniversariesQueryOptions);
  const queryClient = useQueryClient();
  if (!query.data) {
    if (!query.isError) return <Spinner aria-label="기념일을 불러오는 중" />;
    return (
      <LoadErrorAlert
        title="기념일을 불러오지 못했어요"
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  }
  return (
    <AnniversaryManagement
      anniversaries={query.data}
      today={today}
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
