import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";

import { requireMember } from "@/entities/member/server";
import { recordDetailQueryOptions } from "@/entities/record";
import { getRecord } from "@/entities/record/server";
import { fetchRecordCommentPage, recordCommentListQueryOptions } from "@/entities/record-comment";
import { createQueryClient } from "@/shared/lib/react-query/query-client";
import { isUuid } from "@/shared/lib/validation/is-uuid";

import { RecordDetailContent } from "./ui/record-detail-content";

type RecordDetailPageProps = {
  params: Promise<{ recordId: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
};

export async function RecordDetailPage({ params, searchParams }: RecordDetailPageProps) {
  const [{ recordId }, { member, supabase, user }, { from }] = await Promise.all([
    params,
    requireMember(),
    searchParams,
  ]);

  if (!isUuid(recordId)) {
    notFound();
  }

  const content = <RecordDetailContent member={{ id: member.id, name: member.name }} recordId={recordId} />;

  // 목록에서 들어오면 넘겨받은 요약으로 바로 그린다. 알림으로 들어오면 그런 캐시가 없어서
  // 본문과 댓글이 따로 늦게 나타나므로, 서버에서 함께 받아 첫 화면에 한 번에 그린다.
  if (from !== "notification") return content;

  const queryClient = createQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      ...recordDetailQueryOptions(recordId),
      queryFn: async () => {
        const { data, error } = await getRecord(recordId, user.id);
        if (error) throw error;
        return data;
      },
    }),
    queryClient.prefetchInfiniteQuery({
      ...recordCommentListQueryOptions(recordId),
      queryFn: () => fetchRecordCommentPage(supabase, recordId, null),
    }),
  ]);

  return <HydrationBoundary state={dehydrate(queryClient)}>{content}</HydrationBoundary>;
}
