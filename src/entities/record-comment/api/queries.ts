import type { SupabaseClient } from "@supabase/supabase-js";
import { infiniteQueryOptions } from "@tanstack/react-query";

import { createClient } from "@/shared/api/supabase/client";
import type { Database } from "@/shared/api/supabase/database.types";

import {
  getRecordCommentCursorFilter,
  RECORD_COMMENT_PAGE_SIZE,
  type RecordCommentCursor,
} from "../model/record-comment";

export const RECORD_COMMENTS_QUERY_KEY = ["record-comments"] as const;

const RECORD_COMMENT_COLUMNS =
  "id, record_id, author_member_id, body, created_at, author:account_members!record_comments_owner_author_member_fkey(name)";

// 알림으로 여는 기록 상세가 첫 화면에 댓글까지 그릴 수 있게 서버에서도 쓴다.
export const fetchRecordCommentPage = async (
  client: SupabaseClient<Database>,
  recordId: string,
  cursor: RecordCommentCursor | null,
) => {
  let query = client
    .from("record_comments")
    .select(RECORD_COMMENT_COLUMNS)
    .eq("record_id", recordId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(RECORD_COMMENT_PAGE_SIZE + 1);

  if (cursor) query = query.or(getRecordCommentCursorFilter(cursor));

  const { data, error } = await query;
  if (error) throw error;

  const comments = data.slice(0, RECORD_COMMENT_PAGE_SIZE);
  const last = comments.at(-1);

  return {
    comments,
    nextCursor: data.length > RECORD_COMMENT_PAGE_SIZE && last ? { createdAt: last.created_at, id: last.id } : null,
  };
};

export const recordCommentListQueryOptions = (recordId: string) => {
  return infiniteQueryOptions({
    queryKey: [...RECORD_COMMENTS_QUERY_KEY, recordId],
    queryFn: ({ pageParam }) => fetchRecordCommentPage(createClient(), recordId, pageParam),
    initialPageParam: null as RecordCommentCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
  });
};
