export { getCreatedAtCursorFilter as getRecordCommentCursorFilter } from "@/shared/lib/pagination/get-created-at-cursor-filter";

export const RECORD_COMMENT_PAGE_SIZE = 20;

const COMMENT_DATE_TIME = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "long",
  timeZone: "Asia/Seoul",
});

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export type RecordComment = {
  author: { name: string };
  author_member_id: string;
  body: string;
  created_at: string;
  id: string;
  pending?: boolean;
  record_id: string;
};

export type RecordCommentCursor = {
  createdAt: string;
  id: string;
};

export type RecordCommentPage = {
  comments: RecordComment[];
  nextCursor: RecordCommentCursor | null;
};

export type OptimisticCommentAction = { comment: RecordComment; type: "create" } | { id: string; type: "delete" };

export const formatCommentTime = (timestamp: string, now = new Date()) => {
  const date = new Date(timestamp);
  const elapsed = Math.max(0, now.getTime() - date.getTime());

  if (elapsed < MINUTE) return "방금 전";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}분 전`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}시간 전`;
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}일 전`;
  return COMMENT_DATE_TIME.format(date);
};

export const normalizeCommentBody = (value: unknown) => {
  if (typeof value !== "string") return null;

  const body = value.trim();
  return body.length > 0 && [...body].length <= 1000 ? body : null;
};

export const reduceOptimisticComments = (comments: RecordComment[], action: OptimisticCommentAction) => {
  if (action.type === "delete") return comments.filter((comment) => comment.id !== action.id);

  return [action.comment, ...comments.filter((comment) => comment.id !== action.comment.id)];
};
