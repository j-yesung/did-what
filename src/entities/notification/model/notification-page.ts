export { getCreatedAtCursorFilter as getNotificationCursorFilter } from "@/shared/lib/pagination/get-created-at-cursor-filter";

export const NOTIFICATION_PAGE_SIZE = 20;

/** 푸시와 알림 목록이 같은 주소로 기록을 연다. 기록 상세는 from=notification을 보고 읽음 처리한다. */
export const getRecordNotificationHref = (recordId: string, commentId?: string | null) => {
  const recordHref = `/records/${recordId}?from=notification`;
  return commentId ? `${recordHref}#comment-${commentId}` : recordHref;
};

export type NotificationCursor = {
  createdAt: string;
  id: number;
};
