"use client";

import type { Dispatch, SetStateAction } from "react";

import { PageSection } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { LoadMoreButton } from "@/shared/ui/load-more-button";
import { Spinner } from "@/shared/ui/spinner";

import { useRecordComments } from "../model/use-record-comments";
import { CommentCreateForm } from "./comment-create-form";
import { CommentRow } from "./comment-row";

type RecordCommentsProps = {
  draft?: string;
  member: { id: string; name: string };
  onDraftChange?: Dispatch<SetStateAction<string>>;
  recordId: string;
};

export function RecordComments({ draft: initialDraft, member, onDraftChange, recordId }: RecordCommentsProps) {
  const {
    comments,
    draft,
    hasNextPage,
    isLoading,
    isError,
    isRetrying,
    retry,
    isLoadingMore,
    isMoreError,
    loadMore,
    removeComment,
    setDraft,
    submitComment,
    submitDisabled,
  } = useRecordComments({ draft: initialDraft, member, onDraftChange, recordId });

  return (
    <PageSection aria-labelledby="record-comments-title" className="px-5">
      <header className="px-1.5">
        <h2 className="flex items-center gap-1.5 font-semibold text-base" id="record-comments-title">
          댓글
        </h2>
      </header>
      <div className="flex flex-col">
        {isLoading ? <Spinner aria-label="댓글을 불러오는 중" /> : null}
        {isError ? <LoadErrorAlert title="댓글을 불러오지 못했어요" onRetry={retry} retrying={isRetrying} /> : null}
        {/* 오래된 것부터 보여주므로 더 오래된 댓글은 목록 위에서 불러온다. */}
        {hasNextPage ? (
          <LoadMoreButton
            error={isMoreError ? "이전 댓글을 불러오지 못했어요." : undefined}
            label="이전 댓글 보기"
            loading={isLoadingMore}
            onClick={loadMore}
          />
        ) : null}

        {comments.length > 0 ? (
          <ol aria-label={`댓글 ${comments.length}개`} className="-mx-5">
            {comments.map((comment) => (
              <CommentRow comment={comment} currentMemberId={member.id} key={comment.id} onDelete={removeComment} />
            ))}
          </ol>
        ) : null}

        <CommentCreateForm
          disabled={submitDisabled}
          draft={draft}
          memberId={member.id}
          memberName={member.name}
          onDraftChange={setDraft}
          onSubmit={submitComment}
        />
      </div>
    </PageSection>
  );
}
