import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { requireMember } from "@/entities/member/server";
import {
  fetchRecordPage,
  parseRecordFilters,
  type RecordSearchParams,
  recordListQueryOptions,
} from "@/entities/record";
import { getRecordView } from "@/features/record/switch-record-view/server";
import { createQueryClient } from "@/shared/lib/react-query/query-client";

import { getRecordViewFromParams } from "../model/record-view";
import { RecordsScreen } from "./records-screen";

type RecordsPageProps = {
  searchParams: Promise<RecordSearchParams>;
};

export async function RecordsPage({ searchParams }: RecordsPageProps) {
  const [params, savedView, { supabase }] = await Promise.all([searchParams, getRecordView(), requireMember()]);
  const paramsView = getRecordViewFromParams(params);
  const queryClient = createQueryClient();

  if ((paramsView ?? savedView ?? "list") === "list") {
    const filters = parseRecordFilters({ ...params, q: "" });
    await queryClient.prefetchInfiniteQuery({
      ...recordListQueryOptions(filters),
      queryFn: ({ pageParam, signal }) => fetchRecordPage(filters, pageParam, signal, supabase),
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecordsScreen paramsView={paramsView} savedView={savedView} />
    </HydrationBoundary>
  );
}
