import { useState } from "react";

import { XIcon } from "@phosphor-icons/react";

import { MemberAvatar } from "@/entities/member";
import { formatCommentTime, type RecordComment } from "@/entities/record-comment";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog, ConfirmDialogCancelButton } from "@/shared/ui/confirm-dialog";
import { IconButton } from "@/shared/ui/icon-button";

type CommentRowProps = {
  comment: RecordComment;
  continued: boolean;
  currentMemberId: string;
  onDelete: (comment: RecordComment) => void;
};

export function CommentRow({ comment, continued, currentMemberId, onDelete }: CommentRowProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const mine = comment.author_member_id === currentMemberId;
  const showName = !mine && !continued;

  return (
    <>
      <li
        className={cn(
          "flex scroll-mt-24 first:mt-0",
          continued ? "mt-1" : "mt-3",
          mine ? "justify-end" : "justify-start",
        )}
        id={`comment-${comment.id}`}
      >
        <article
          aria-busy={comment.pending || undefined}
          className={cn("flex max-w-[82%] items-end gap-2", mine && "flex-row-reverse")}
        >
          {mine ? null : (
            <MemberAvatar
              className={cn("size-7 text-xs", continued && "invisible")}
              memberId={comment.author_member_id}
              name={comment.author.name}
            />
          )}
          <div className="flex min-w-0 flex-col">
            {showName ? (
              <p className="mb-1 ml-1 truncate font-semibold text-muted-foreground text-xs">{comment.author.name}</p>
            ) : (
              <span className="sr-only">{mine ? "내 댓글" : comment.author.name}</span>
            )}
            <div className="relative">
              <p
                className={cn(
                  "wrap-break-word whitespace-pre-wrap rounded-[20px] px-3.5 py-2.5 text-[15px] leading-[1.45] transition-opacity",
                  mine ? "rounded-br-md bg-foreground text-background" : "rounded-bl-md bg-surface",
                  comment.pending && "opacity-60",
                )}
              >
                {comment.body}
              </p>
              {mine ? (
                <IconButton
                  aria-label="내 댓글 삭제"
                  className="absolute -top-2 -left-2 size-6 rounded-full bg-surface text-foreground/70 shadow-sm before:-inset-2.5 active:bg-input"
                  disabled={comment.pending}
                  icon={XIcon}
                  iconSize={12}
                  iconWeight="bold"
                  onClick={() => setDeleteOpen(true)}
                  size="sm"
                />
              ) : null}
            </div>
          </div>
          <time
            className="shrink-0 whitespace-nowrap pb-0.5 text-[11px] text-muted-foreground"
            dateTime={comment.created_at}
          >
            {formatCommentTime(comment.created_at)}
          </time>
        </article>
      </li>

      <ConfirmDialog
        cancelButton={
          <ConfirmDialogCancelButton disabled={comment.pending} onClick={() => setDeleteOpen(false)}>
            취소
          </ConfirmDialogCancelButton>
        }
        confirmButton={
          <Button
            color="danger"
            disabled={comment.pending}
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
    </>
  );
}
