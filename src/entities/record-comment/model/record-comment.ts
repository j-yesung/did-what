export const RECORD_COMMENT_PAGE_SIZE = 20;

export type RecordComment = {
  author: { name: string };
  author_member_id: string;
  body: string;
  created_at: string;
  id: string;
  pending?: boolean;
  record_id: string;
  updated_at: string;
};

export type RecordCommentCursor = {
  createdAt: string;
  id: string;
};

export type RecordCommentPage = {
  comments: RecordComment[];
  nextCursor: RecordCommentCursor | null;
};

export type OptimisticCommentAction =
  | { comment: RecordComment; type: "create" }
  | { body: string; id: string; type: "update" }
  | { id: string; type: "delete" };

export const normalizeCommentBody = (value: unknown) => {
  if (typeof value !== "string") return null;

  const body = value.trim();
  return body.length > 0 && [...body].length <= 1000 ? body : null;
};

export const getRecordCommentCursorFilter = (cursor: RecordCommentCursor) => {
  return `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`;
};

export const reduceOptimisticComments = (comments: RecordComment[], action: OptimisticCommentAction) => {
  if (action.type === "delete") return comments.filter((comment) => comment.id !== action.id);
  if (action.type === "update") {
    return comments.map((comment) =>
      comment.id === action.id ? { ...comment, body: action.body, pending: true } : comment,
    );
  }

  return [action.comment, ...comments.filter((comment) => comment.id !== action.comment.id)];
};
