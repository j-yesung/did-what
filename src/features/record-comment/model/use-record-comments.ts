"use client";

import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";

import { type InfiniteData, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import {
  normalizeCommentBody,
  type OptimisticCommentAction,
  type RecordComment,
  type RecordCommentPage,
  recordCommentListQueryOptions,
  reduceOptimisticComments,
} from "@/entities/record-comment";
import { showNotice } from "@/shared/lib/notice";

import { createComment, deleteComment } from "../api/comment-actions";

type UseRecordCommentsProps = {
  member: { id: string; name: string };
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

export const useRecordComments = ({ member, recordId }: UseRecordCommentsProps) => {
  const [draft, setDraft] = useState("");
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
            showNotice({ description: result.message, title: "댓글을 남기지 못했어요", variant: "warning" });
            return;
          }
          commitCache({ comment: result.comment, type: "create" });
        } catch {
          setDraft((current) => current || body);
          showNotice({ title: "댓글을 남기지 못했어요", variant: "error" });
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
          showNotice({ description: result.message, title: "댓글을 삭제하지 못했어요", variant: "warning" });
          void commentsQuery.refetch();
          return;
        }
        commitCache({ id: result.commentId, type: "delete" });
      } catch {
        showNotice({ title: "댓글을 삭제하지 못했어요", variant: "error" });
      }
    });
  };

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
    comments: optimisticComments,
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
