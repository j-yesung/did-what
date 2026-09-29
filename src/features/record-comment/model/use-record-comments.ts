"use client";

import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";

import { type InfiniteData, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { RECORDS_QUERY_KEY } from "@/entities/record";
import {
  normalizeCommentBody,
  type OptimisticCommentAction,
  type RecordComment,
  type RecordCommentPage,
  recordCommentListQueryOptions,
  reduceOptimisticComments,
} from "@/entities/record-comment";
import { showToast } from "@/shared/lib/toast";

import { createComment, deleteComment } from "../api/comment-actions";

type UseRecordCommentsProps = {
  draft?: string;
  member: { id: string; name: string };
  onDraftChange?: Dispatch<SetStateAction<string>>;
  recordId: string;
};

type CacheAction = { comment: RecordComment; type: "create" } | { id: string; type: "delete" };

const applyCommentCacheAction = (
  current: InfiniteData<RecordCommentPage> | undefined,
  action: CacheAction,
): InfiniteData<RecordCommentPage> | undefined => {
  if (!current) {
    return action.type === "create"
      ? { pageParams: [null], pages: [{ comments: [action.comment], nextCursor: null }] }
      : current;
  }

  if (action.type === "delete") {
    return {
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        comments: page.comments.filter((comment) => comment.id !== action.id),
      })),
    };
  }

  const [firstPage, ...rest] = current.pages;
  if (!firstPage) return current;

  return {
    ...current,
    pages: [
      { ...firstPage, comments: [action.comment, ...firstPage.comments.filter(({ id }) => id !== action.comment.id)] },
      ...rest,
    ],
  };
};

export const useRecordComments = ({
  draft: externalDraft,
  member,
  onDraftChange,
  recordId,
}: UseRecordCommentsProps) => {
  const [internalDraft, setInternalDraft] = useState("");
  const draft = externalDraft ?? internalDraft;
  const setDraft = onDraftChange ?? setInternalDraft;
  const [submittedCommentId, setSubmittedCommentId] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();
  const submittingRef = useRef(false);
  const scrolledHashRef = useRef("");
  const queryClient = useQueryClient();
  const queryOptions = recordCommentListQueryOptions(recordId);
  const commentsQuery = useInfiniteQuery(queryOptions);
  const comments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page.comments) ?? [],
    [commentsQuery.data],
  );
  const [optimisticComments, dispatchOptimistic] = useOptimistic(comments, reduceOptimisticComments);
  const normalizedDraft = normalizeCommentBody(draft);

  const commitCache = (action: CacheAction) => {
    queryClient.setQueryData<InfiniteData<RecordCommentPage>>(queryOptions.queryKey, (current) =>
      applyCommentCacheAction(current, action),
    );
    void queryClient.invalidateQueries({ queryKey: queryOptions.queryKey });
    // 기록 목록의 댓글 수도 돌아갔을 때 다시 받는다.
    void queryClient.invalidateQueries({ queryKey: [...RECORDS_QUERY_KEY, "list"] });
  };

  const runOptimistic = (action: OptimisticCommentAction, request: () => Promise<void>) => {
    startTransition(async () => {
      dispatchOptimistic(action);
      await request();
    });
  };

  const submitComment = () => {
    if (!normalizedDraft || submittingRef.current) return;

    const body = normalizedDraft;
    const commentId = crypto.randomUUID();
    const now = new Date().toISOString();
    submittingRef.current = true;
    setDraft("");
    setSubmittedCommentId(commentId);

    runOptimistic(
      {
        comment: {
          author: { name: member.name },
          author_member_id: member.id,
          body,
          created_at: now,
          id: commentId,
          pending: true,
          record_id: recordId,
        },
        type: "create",
      },
      async () => {
        try {
          const result = await createComment({ body, commentId, expectedMemberId: member.id, recordId });
          if (result.status === "error" || !result.comment) {
            setDraft((current) => current || body);
            showToast({ description: result.message, title: "댓글을 남기지 못했어요", variant: "warning" });
            return;
          }
          commitCache({ comment: result.comment, type: "create" });
        } catch {
          setDraft((current) => current || body);
          showToast({ title: "댓글을 남기지 못했어요", variant: "error" });
        } finally {
          submittingRef.current = false;
        }
      },
    );
  };

  const removeComment = (comment: RecordComment) => {
    runOptimistic({ id: comment.id, type: "delete" }, async () => {
      try {
        const result = await deleteComment({ commentId: comment.id, expectedMemberId: member.id, recordId });
        if (result.status === "error" || !result.commentId) {
          showToast({ description: result.message, title: "댓글을 삭제하지 못했어요", variant: "warning" });
          void commentsQuery.refetch();
          return;
        }
        commitCache({ id: result.commentId, type: "delete" });
      } catch {
        showToast({ title: "댓글을 삭제하지 못했어요", variant: "error" });
      }
    });
  };

  // 새 댓글은 입력창 바로 위에 생긴다. 키보드나 긴 목록에 가려지지 않게 보이는 곳으로 옮긴다.
  // biome-ignore lint/correctness/useExhaustiveDependencies: 낙관적 댓글이 그려진 뒤에 다시 찾아야 해서 목록을 계기로 둔다.
  useEffect(() => {
    if (!submittedCommentId) return;
    const target = document.getElementById(`comment-${submittedCommentId}`);
    if (!target) return;
    setSubmittedCommentId(null);
    target.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [optimisticComments, submittedCommentId]);

  useEffect(() => {
    if (!comments.length) return;
    const commentId = window.location.hash.slice(1);
    if (!commentId.startsWith("comment-") || scrolledHashRef.current === commentId) return;
    const target = document.getElementById(commentId);
    if (!target) {
      if (commentsQuery.hasNextPage && !commentsQuery.isFetchingNextPage && !commentsQuery.isFetchNextPageError) {
        void commentsQuery.fetchNextPage();
      }
      return;
    }
    scrolledHashRef.current = commentId;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [
    comments,
    commentsQuery.fetchNextPage,
    commentsQuery.hasNextPage,
    commentsQuery.isFetchNextPageError,
    commentsQuery.isFetchingNextPage,
  ]);

  return {
    // 서버와 캐시는 최신순이다. 대화처럼 오래된 것부터 보여주고, 새 댓글이 입력창 가까이에 생기게 뒤집는다.
    comments: [...optimisticComments].reverse(),
    draft,
    hasNextPage: commentsQuery.hasNextPage,
    isLoadingMore: commentsQuery.isFetchingNextPage,
    isMoreError: commentsQuery.isFetchNextPageError,
    loadMore: () => void commentsQuery.fetchNextPage(),
    removeComment,
    setDraft,
    submitComment,
    submitDisabled: !normalizedDraft || isSubmitting,
  };
};
