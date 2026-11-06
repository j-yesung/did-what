import { useLayoutEffect, useRef } from "react";

import { ArrowUpIcon } from "@phosphor-icons/react";

import { MemberAvatar } from "@/entities/member";
import { MAX_COMMENT_LENGTH } from "@/entities/record-comment";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";

// 한도에 가까워졌을 때만 글자 수를 보여준다. 그 전에는 짧은 댓글에 숫자가 방해가 된다.
const COUNTER_FROM = MAX_COMMENT_LENGTH - 100;

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || textarea.value !== draft) return;
    const probe = textarea.cloneNode() as HTMLTextAreaElement;
    probe.removeAttribute("id");
    probe.setAttribute("aria-hidden", "true");
    probe.tabIndex = -1;
    probe.value = draft;
    Object.assign(probe.style, {
      height: "auto",
      pointerEvents: "none",
      position: "absolute",
      transition: "none",
      visibility: "hidden",
      width: `${textarea.offsetWidth}px`,
    });
    textarea.after(probe);
    const height = `${probe.scrollHeight}px`;
    probe.remove();
    if (textarea.style.height !== height) textarea.style.height = height;
  }, [draft]);

  return (
    <form
      className="mt-7"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex min-h-14 items-start gap-3 rounded-[28px] bg-surface p-1.5">
        <div className="flex min-w-0 flex-1 items-start gap-3 pt-1">
          <MemberAvatar memberId={memberId} name={memberName} />
          <label className="sr-only" htmlFor="record-comment-body">
            {memberName}으로 댓글 남기기
          </label>
          <Textarea
            className="field-sizing-fixed min-h-9 resize-none overflow-hidden border-0 bg-transparent! px-0 py-2 shadow-none transition-[height] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-0 motion-reduce:transition-none"
            aria-describedby={length >= COUNTER_FROM ? "record-comment-count" : undefined}
            id="record-comment-body"
            maxLength={MAX_COMMENT_LENGTH}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="한마디 남기기"
            ref={textareaRef}
            rows={1}
            value={draft}
          />
        </div>
        <Button
          aria-label="댓글 게시"
          className="size-11 min-w-0 self-end rounded-full bg-foreground p-0 text-background"
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
