"use server";

import { after } from "next/server";

import { requireMember } from "@/entities/member/server";
import { normalizeCommentBody, type RecordComment } from "@/entities/record-comment";
import { sendCommentPush } from "@/features/push-notification/server";
import { isUuid } from "@/shared/lib/validation/is-uuid";

type CommentActionState = {
  comment?: RecordComment;
  commentId?: string;
  message?: string;
  status: "error" | "success";
};

type CreateCommentInput = {
  body: string;
  commentId: string;
  expectedMemberId: string;
  recordId: string;
};

type DeleteCommentInput = {
  commentId: string;
  expectedMemberId: string;
  recordId: string;
};

const invalidComment = (): CommentActionState => ({
  message: "댓글 내용을 다시 확인해 주세요.",
  status: "error",
});

const hasValidContext = (input: { commentId: string; expectedMemberId: string; recordId: string }) => {
  return isUuid(input.commentId) && isUuid(input.expectedMemberId) && isUuid(input.recordId);
};

export const createComment = async (input: CreateCommentInput): Promise<CommentActionState> => {
  const body = normalizeCommentBody(input.body);
  if (!body || !hasValidContext(input)) return invalidComment();

  const { member, supabase, user } = await requireMember();
  if (member.id !== input.expectedMemberId) {
    return { message: "작성 멤버가 변경됐어요. 화면을 확인한 뒤 다시 작성해 주세요.", status: "error" };
  }

  const { data, error } = await supabase.rpc("create_record_comment", {
    p_author_member_id: member.id,
    p_body: body,
    p_comment_id: input.commentId,
    p_record_id: input.recordId,
  });
  const saved = data?.[0];
  if (error || !saved) {
    return { message: "잠시 후 다시 시도해 주세요.", status: "error" };
  }

  const comment: RecordComment = {
    author: { name: saved.author_name },
    author_member_id: saved.author_member_id,
    body: saved.body,
    created_at: saved.created_at,
    id: saved.id,
    record_id: saved.record_id,
  };

  if (saved.created) {
    after(async () => {
      try {
        await sendCommentPush({
          commentId: comment.id,
          ownerId: user.id,
          recordId: comment.record_id,
          senderMemberId: member.id,
          senderName: member.name,
          supabase,
        });
      } catch {
        // 푸시는 부가 기능이라 발송 실패가 저장된 댓글의 결과를 바꾸지 않는다.
      }
    });
  }

  return { comment, status: "success" };
};

export const deleteComment = async (input: DeleteCommentInput): Promise<CommentActionState> => {
  if (!hasValidContext(input)) return invalidComment();

  const { member, supabase, user } = await requireMember();
  if (member.id !== input.expectedMemberId) {
    return { message: "작성 멤버가 변경됐어요. 화면을 확인한 뒤 다시 삭제해 주세요.", status: "error" };
  }

  const { data, error } = await supabase
    .from("record_comments")
    .delete()
    .eq("id", input.commentId)
    .eq("record_id", input.recordId)
    .eq("owner_id", user.id)
    .eq("author_member_id", member.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { message: "댓글이 이미 변경됐거나 삭제할 수 없어요.", status: "error" };
  }

  return { commentId: data.id, status: "success" };
};
