import { ArrowUpIcon } from "@phosphor-icons/react";

import { MemberAvatar } from "@/entities/member";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";

const MAX_COMMENT_LENGTH = 1000;
// 한도에 가까워졌을 때만 글자 수를 보여준다. 그 전에는 짧은 댓글에 숫자가 방해가 된다.
const COUNTER_FROM = 900;

type CommentCreateFormProps = {
  disabled: boolean;
  draft: string;
  memberId: string;
  memberName: string;
  onDraftChange: (draft: string) => void;
  onSubmit: () => void;
};

export function CommentCreateForm({
  disabled,
  draft,
  memberId,
  memberName,
  onDraftChange,
  onSubmit,
}: CommentCreateFormProps) {
  const length = [...draft].length;

  return (
    <form
      className="mt-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex min-h-14 items-center gap-3 rounded-3xl bg-surface p-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <MemberAvatar memberId={memberId} name={memberName} />
          <label className="sr-only" htmlFor="record-comment-body">
            {memberName}으로 댓글 남기기
          </label>
          <Textarea
            className="min-h-9 resize-none border-0 bg-transparent! px-0 py-2 shadow-none focus-visible:ring-0"
            aria-describedby={length >= COUNTER_FROM ? "record-comment-count" : undefined}
            id="record-comment-body"
            maxLength={MAX_COMMENT_LENGTH}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="댓글 남기기…"
            rows={1}
            value={draft}
          />
        </div>
        <Button
          aria-label="댓글 게시"
          className="size-11 min-w-0 self-end rounded-full bg-dark p-0 text-dark-foreground dark:bg-light dark:text-dark"
          color="dark"
          disabled={disabled}
          onPointerDown={(event) => event.preventDefault()}
          type="submit"
        >
          <ArrowUpIcon aria-hidden="true" weight="bold" />
        </Button>
      </div>
      {length >= COUNTER_FROM ? (
        <p className="mt-1.5 px-3 text-right text-muted-foreground text-xs tabular-nums" id="record-comment-count">
          {length}/{MAX_COMMENT_LENGTH}
        </p>
      ) : null}
    </form>
  );
}
