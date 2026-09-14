export { getCreatedAtCursorFilter as getNotificationCursorFilter } from "@/shared/lib/pagination/get-created-at-cursor-filter";

export const NOTIFICATION_PAGE_SIZE = 20;

export type NotificationCursor = {
  createdAt: string;
  id: number;
};
