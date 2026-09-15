"use client";

import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";

import { ArrowUpIcon, PencilSimpleIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { type InfiniteData, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import {
  formatCommentTime,
  normalizeCommentBody,
  type OptimisticCommentAction,
  type RecordComment,
  recordCommentListQueryOptions,
  type RecordCommentPage,
  reduceOptimisticComments,
} from "@/entities/record-comment";
import { showNotice } from "@/shared/lib/notice";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog, ConfirmDialogCancelButton } from "@/shared/ui/confirm-dialog";
import { IconButton } from "@/shared/ui/icon-button";
import { LoadMoreButton } from "@/shared/ui/load-more-button";
import { Textarea } from "@/shared/ui/textarea";

import { createComment, deleteComment, updateComment } from "../api/comment-actions";

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
    <section aria-labelledby="record-comments-title" className="-mx-5 border-t px-5 pt-5">
      <header className="px-1.5">
        <h2 className="flex items-center gap-1.5 font-semibold text-base" id="record-comments-title">
          댓글 <span className="font-normal text-muted-foreground text-sm">{optimisticComments.length}</span>
        </h2>
      </header>
      <div className="flex flex-col">
        {commentsQuery.isPending && optimisticComments.length === 0 ? (
          <p className="py-5 text-center text-muted-foreground text-sm">댓글을 불러오는 중이에요.</p>
        ) : commentsQuery.isError && !commentsQuery.data && optimisticComments.length === 0 ? (
          <div className="flex items-center justify-between gap-3 px-1.5 py-4 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <WarningCircleIcon aria-hidden="true" /> 댓글을 불러오지 못했어요.
            </span>
            <Button onClick={() => commentsQuery.refetch()} type="button" variant="weak">
              다시 시도
            </Button>
          </div>
        ) : optimisticComments.length > 0 ? (
          <ol aria-label={`댓글 ${optimisticComments.length}개`} className="-mx-5">
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
        ) : null}

        {commentsQuery.hasNextPage ? (
          <LoadMoreButton
            error={commentsQuery.isFetchNextPageError ? "댓글을 더 불러오지 못했어요." : undefined}
            loading={commentsQuery.isFetchingNextPage}
            onClick={() => commentsQuery.fetchNextPage()}
          />
        ) : null}

        <form
          className="mt-3"
          onSubmit={(event) => {
            event.preventDefault();
            submitComment();
          }}
        >
          <div className="flex min-h-14 items-center gap-3 rounded-3xl bg-surface p-1.5" key="composer">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <img
                alt=""
                className="size-9 shrink-0 rounded-full bg-background object-cover"
                src="/member-avatar.svg"
              />
              <label className="sr-only" htmlFor="record-comment-body">
                {member.name}으로 댓글 남기기
              </label>
              <Textarea
                className="min-h-9 resize-none border-0 bg-transparent! px-0 py-2 shadow-none focus-visible:ring-0"
                id="record-comment-body"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="댓글 남기기..."
                rows={1}
                value={draft}
              />
            </div>
            <Button
              aria-label="댓글 게시"
              className="size-11 min-w-0 self-end rounded-full bg-dark p-0 text-dark-foreground dark:bg-light dark:text-dark"
              color="dark"
              disabled={!normalizedDraft || isPending}
              onPointerDown={(event) => event.preventDefault()}
              type="submit"
            >
              <ArrowUpIcon aria-hidden="true" weight="bold" />
            </Button>
          </div>
        </form>
      </div>
    </section>
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
    <li className="scroll-mt-24 border-b px-6.5 py-4" id={`comment-${comment.id}`}>
      <article aria-busy={comment.pending || undefined} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3">
        <img alt="" className="size-9 rounded-full bg-muted object-cover" src="/member-avatar.svg" />
        <div className="min-w-0">
          <header>
            <p className="truncate font-semibold text-sm">
              {comment.author.name}
              {mine ? <span className="ml-1 font-medium text-primary text-xs">나</span> : null}
              <span className="ml-2 font-normal text-muted-foreground text-xs">
                <time dateTime={comment.created_at}>{formatCommentTime(comment.created_at)}</time>
                {changed ? " · 수정됨" : null}
              </span>
            </p>
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
            <>
              <p className="wrap-break-word mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">{comment.body}</p>
              {mine ? (
                <footer className="mt-1 flex items-center justify-end gap-1">
                  <IconButton
                    aria-label={`${comment.author.name} 댓글 수정`}
                    disabled={comment.pending}
                    icon={PencilSimpleIcon}
                    onClick={() => {
                      setDraft(comment.body);
                      setEditing(true);
                    }}
                  />
                  <IconButton
                    aria-label={`${comment.author.name} 댓글 삭제`}
                    disabled={comment.pending}
                    icon={TrashIcon}
                    onClick={() => setDeleteOpen(true)}
                  />
                </footer>
              ) : null}
            </>
          )}
        </div>
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
