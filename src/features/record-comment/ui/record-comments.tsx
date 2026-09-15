"use client";

import { PageSection } from "@/shared/ui/layouts";
import { LoadMoreButton } from "@/shared/ui/load-more-button";

import { useRecordComments } from "../model/use-record-comments";
import { CommentCreateForm } from "./comment-create-form";
import { CommentRow } from "./comment-row";

type RecordCommentsProps = {
  member: { id: string; name: string };
  recordId: string;
};

export function RecordComments({ member, recordId }: RecordCommentsProps) {
  const {
    comments,
    draft,
    hasNextPage,
    isLoadingMore,
    isMoreError,
    loadMore,
    removeComment,
    setDraft,
    submitComment,
    submitDisabled,
  } = useRecordComments({ member, recordId });

  return (
    <PageSection aria-labelledby="record-comments-title" className="px-5">
      <header className="px-1.5">
        <h2 className="flex items-center gap-1.5 font-semibold text-base" id="record-comments-title">
          댓글 <span className="font-normal text-muted-foreground text-sm">{comments.length}</span>
        </h2>
      </header>
      <div className="flex flex-col">
        {comments.length > 0 ? (
          <ol aria-label={`댓글 ${comments.length}개`} className="-mx-5">
            {comments.map((comment) => (
              <CommentRow comment={comment} currentMemberId={member.id} key={comment.id} onDelete={removeComment} />
            ))}
          </ol>
        ) : null}

        {hasNextPage ? (
          <LoadMoreButton
            error={isMoreError ? "댓글을 더 불러오지 못했어요." : undefined}
            loading={isLoadingMore}
            onClick={loadMore}
          />
        ) : null}

        <CommentCreateForm
          disabled={submitDisabled}
          draft={draft}
          memberName={member.name}
          onDraftChange={setDraft}
          onSubmit={submitComment}
        />
      </div>
    </PageSection>
  );
}
