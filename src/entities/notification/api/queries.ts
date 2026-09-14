import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { createClient } from "@/shared/api/supabase/client";

import {
  getNotificationCursorFilter,
  NOTIFICATION_PAGE_SIZE,
  type NotificationCursor,
} from "../model/notification-page";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

const NOTIFICATION_COLUMNS = "id, event_type, comment_id, sender_name, record_id, record_title, read_at, created_at";

const fetchNotificationPage = async (memberId: string, cursor: NotificationCursor | null) => {
  let query = createClient()
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .eq("recipient_member_id", memberId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(NOTIFICATION_PAGE_SIZE + 1);

  if (cursor) query = query.or(getNotificationCursorFilter(cursor));

  const { data, error } = await query;
  if (error) throw error;

  const notifications = data.slice(0, NOTIFICATION_PAGE_SIZE);
  const last = notifications.at(-1);

  return {
    nextCursor: data.length > NOTIFICATION_PAGE_SIZE && last ? { createdAt: last.created_at, id: last.id } : null,
    notifications,
  };
};

export type NotificationItem = Awaited<ReturnType<typeof fetchNotificationPage>>["notifications"][number];

export const getNotificationHref = (notification: NotificationItem) => {
  if (!notification.record_id) return null;
  return notification.comment_id
    ? `/records/${notification.record_id}#comment-${notification.comment_id}`
    : `/records/${notification.record_id}`;
};

export const notificationListQueryOptions = (memberId: string) => {
  return infiniteQueryOptions({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, memberId, "list"],
    queryFn: ({ pageParam }) => fetchNotificationPage(memberId, pageParam),
    initialPageParam: null as NotificationCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
};

export const unreadNotificationCountQueryOptions = (memberId: string) => {
  return queryOptions({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, memberId, "unread-count"],
    queryFn: async () => {
      const { count, error } = await createClient()
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_member_id", memberId)
        .is("read_at", null);

      if (error) throw error;
      return count ?? 0;
    },
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
};
