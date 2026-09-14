"use client";

import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";

import { ChatCircleTextIcon, PencilSimpleIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
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
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ConfirmDialog, ConfirmDialogCancelButton } from "@/shared/ui/confirm-dialog";
import { IconButton } from "@/shared/ui/icon-button";
import { LoadMoreButton } from "@/shared/ui/load-more-button";
import { Textarea } from "@/shared/ui/textarea";

import { createComment, deleteComment, updateComment } from "../api/comment-actions";

const COMMENT_TIME = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  timeZone: "Asia/Seoul",
});

type RecordCommentsProps = {
  member: { id: string; name: string };
  recordId: string;
};

type CacheAction = { comment: RecordComment; type: "create" | "update" } | { id: string; type: "delete" };

const updateCommentCache = (
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

  if (action.type === "update") {
    return {
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        comments: page.comments.map((comment) => (comment.id === action.comment.id ? action.comment : comment)),
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

export function RecordComments({ member, recordId }: RecordCommentsProps) {
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const submittingRef = useRef(false);
  const scrolledHashRef = useRef("");
  const queryClient = useQueryClient();
  const queryOptions = recordCommentListQueryOptions(recordId);
  const commentsQuery = useInfiniteQuery(queryOptions);
  const comments = useMemo(() => {
    return commentsQuery.data?.pages.flatMap((page) => page.comments) ?? [];
  }, [commentsQuery.data]);
  const [optimisticComments, dispatchOptimistic] = useOptimistic(comments, reduceOptimisticComments);
  const normalizedDraft = normalizeCommentBody(draft);

  const commitCache = (action: CacheAction) => {
    queryClient.setQueryData<InfiniteData<RecordCommentPage>>(queryOptions.queryKey, (current) =>
      updateCommentCache(current, action),
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
          updated_at: now,
        },
        type: "create",
      },
      async () => {
        try {
          const result = await createComment({ body, commentId, expectedMemberId: member.id, recordId });
          if (result.status === "error" || !result.comment) {
            setDraft((current) => current || body);
            showNotice({
              description: result.message,
              title: "댓글을 남기지 못했어요",
              variant: "warning",
            });
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

  const editComment = (comment: RecordComment, body: string, restore: () => void) => {
    const normalizedBody = normalizeCommentBody(body);
    if (!normalizedBody || normalizedBody === comment.body) return;

    runOptimistic({ body: normalizedBody, id: comment.id, type: "update" }, async () => {
      try {
        const result = await updateComment({
          body: normalizedBody,
          commentId: comment.id,
          expectedMemberId: member.id,
          expectedUpdatedAt: comment.updated_at,
          recordId,
        });
        if (result.status === "error" || !result.comment) {
          restore();
          showNotice({ description: result.message, title: "댓글을 수정하지 못했어요", variant: "warning" });
          void commentsQuery.refetch();
          return;
        }
        commitCache({ comment: result.comment, type: "update" });
      } catch {
        restore();
        showNotice({ title: "댓글을 수정하지 못했어요", variant: "error" });
      }
    });
  };

  const removeComment = (comment: RecordComment) => {
    runOptimistic({ id: comment.id, type: "delete" }, async () => {
      try {
        const result = await deleteComment({
          commentId: comment.id,
          expectedMemberId: member.id,
          expectedUpdatedAt: comment.updated_at,
          recordId,
        });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-muted-foreground">
          <ChatCircleTextIcon aria-hidden="true" size={18} />
          댓글
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            submitComment();
          }}
        >
          <label className="font-medium text-sm" htmlFor="record-comment-body">
            {member.name}으로 댓글 남기기
          </label>
          <Textarea
            id="record-comment-body"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="함께 기억하고 싶은 이야기를 남겨보세요."
            rows={2}
            value={draft}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground text-xs">{[...draft.trim()].length}/1,000</span>
            <Button disabled={!normalizedDraft || isPending} type="submit">
              댓글 남기기
            </Button>
          </div>
        </form>

        {commentsQuery.isPending ? (
          <p className="py-4 text-center text-muted-foreground text-sm">댓글을 불러오는 중이에요.</p>
        ) : commentsQuery.isError && !commentsQuery.data ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <WarningCircleIcon aria-hidden="true" /> 댓글을 불러오지 못했어요.
            </span>
            <Button onClick={() => commentsQuery.refetch()} type="button" variant="weak">
              다시 시도
            </Button>
          </div>
        ) : optimisticComments.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-sm">이 기록에 첫 댓글을 남겨보세요.</p>
        ) : (
          <ol aria-label={`댓글 ${optimisticComments.length}개`} className="flex flex-col gap-4">
            {optimisticComments.map((comment) => (
              <CommentRow
                comment={comment}
                currentMemberId={member.id}
                key={comment.id}
                onDelete={removeComment}
                onEdit={editComment}
              />
            ))}
          </ol>
        )}

        {commentsQuery.hasNextPage ? (
          <LoadMoreButton
            error={commentsQuery.isFetchNextPageError ? "댓글을 더 불러오지 못했어요." : undefined}
            loading={commentsQuery.isFetchingNextPage}
            onClick={() => commentsQuery.fetchNextPage()}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

type CommentRowProps = {
  comment: RecordComment;
  currentMemberId: string;
  onDelete: (comment: RecordComment) => void;
  onEdit: (comment: RecordComment, body: string, restore: () => void) => void;
};

function CommentRow({ comment, currentMemberId, onDelete, onEdit }: CommentRowProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const mine = comment.author_member_id === currentMemberId;
  const changed = comment.updated_at !== comment.created_at;
  const normalizedDraft = normalizeCommentBody(draft);

  return (
    <li className="scroll-mt-24" id={`comment-${comment.id}`}>
      <article aria-busy={comment.pending || undefined} className={comment.pending ? "opacity-60" : undefined}>
        <header className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm">
              {comment.author.name}
              {mine ? <span className="ml-1 font-medium text-primary text-xs">나</span> : null}
            </p>
            <p className="text-muted-foreground text-xs">
              <time dateTime={comment.created_at}>{COMMENT_TIME.format(new Date(comment.created_at))}</time>
              {changed ? " · 수정됨" : null}
              {comment.pending ? " · 저장 중" : null}
            </p>
          </div>
          {mine && !editing ? (
            <div className="flex shrink-0 gap-1">
              <IconButton
                aria-label={`${comment.author.name} 댓글 수정`}
                disabled={comment.pending}
                icon={PencilSimpleIcon}
                onClick={() => {
                  setDraft(comment.body);
                  setEditing(true);
                }}
                size="sm"
              />
              <IconButton
                aria-label={`${comment.author.name} 댓글 삭제`}
                disabled={comment.pending}
                icon={TrashIcon}
                onClick={() => setDeleteOpen(true)}
                size="sm"
              />
            </div>
          ) : null}
        </header>

        {editing ? (
          <form
            className="mt-2 flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!normalizedDraft || normalizedDraft === comment.body) return;
              setEditing(false);
              onEdit(comment, normalizedDraft, () => setEditing(true));
            }}
          >
            <label className="sr-only" htmlFor={`comment-edit-${comment.id}`}>
              댓글 수정
            </label>
            <Textarea
              id={`comment-edit-${comment.id}`}
              onChange={(event) => setDraft(event.target.value)}
              value={draft}
            />
            <div className="flex justify-end gap-2">
              <Button
                color="dark"
                onClick={() => {
                  setDraft(comment.body);
                  setEditing(false);
                }}
                type="button"
                variant="weak"
              >
                취소
              </Button>
              <Button disabled={!normalizedDraft || normalizedDraft === comment.body} type="submit">
                저장
              </Button>
            </div>
          </form>
        ) : (
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{comment.body}</p>
        )}
      </article>

      <ConfirmDialog
        cancelButton={<ConfirmDialogCancelButton onClick={() => setDeleteOpen(false)}>취소</ConfirmDialogCancelButton>}
        confirmButton={
          <Button
            color="danger"
            onClick={() => {
              setDeleteOpen(false);
              onDelete(comment);
            }}
          >
            댓글 삭제
          </Button>
        }
        description="삭제한 댓글은 되돌릴 수 없어요."
        onClose={() => setDeleteOpen(false)}
        open={deleteOpen}
        title="댓글을 삭제할까요?"
      />
    </li>
  );
}
