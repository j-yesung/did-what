import { useState } from "react";

import { XIcon } from "@phosphor-icons/react";

import { formatCommentTime, type RecordComment } from "@/entities/record-comment";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog, ConfirmDialogCancelButton } from "@/shared/ui/confirm-dialog";
import { IconButton } from "@/shared/ui/icon-button";

type CommentRowProps = {
  comment: RecordComment;
  currentMemberId: string;
  onDelete: (comment: RecordComment) => void;
};

export function CommentRow({ comment, currentMemberId, onDelete }: CommentRowProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const mine = comment.author_member_id === currentMemberId;

  return (
    <>
      <li className="scroll-mt-24 border-b px-6.5 py-4" id={`comment-${comment.id}`}>
        <article aria-busy={comment.pending || undefined} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3">
          <img alt="" className="size-9 rounded-full bg-muted object-cover" src="/member-avatar.svg" />
          <div className="min-w-0">
            <header className="flex min-h-7 min-w-0 items-center justify-between gap-2">
              <p className="min-w-0 truncate font-semibold text-sm">
                {comment.author.name}
                {mine ? <span className="ml-1 font-medium text-primary text-xs">나</span> : null}
                <span className="ml-2 font-normal text-muted-foreground text-xs">
                  <time dateTime={comment.created_at}>{formatCommentTime(comment.created_at)}</time>
                </span>
              </p>
              {mine ? (
                <IconButton
                  aria-label={`${comment.author.name} 댓글 삭제`}
                  className="before:absolute before:-inset-2 before:content-['']"
                  disabled={comment.pending}
                  icon={XIcon}
                  iconStrokeWidth={2}
                  onClick={() => setDeleteOpen(true)}
                  size="sm"
                />
              ) : null}
            </header>

            <p className="wrap-break-word whitespace-pre-wrap text-[15px] leading-relaxed">{comment.body}</p>
          </div>
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
