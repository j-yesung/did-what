export const NOTIFICATION_PAGE_SIZE = 20;

export type NotificationCursor = {
  createdAt: string;
  id: number;
};

export function getNotificationCursorFilter(cursor: NotificationCursor) {
  return `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`;
}
