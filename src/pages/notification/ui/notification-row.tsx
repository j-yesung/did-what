import { CaretRightIcon } from "@phosphor-icons/react";

import { getNotificationHref, type NotificationItem } from "@/entities/notification";
import { cn } from "@/shared/lib/utils";
import { ListRow } from "@/shared/ui/list-row";
import { PressLink } from "@/shared/ui/press-link";

const NOTIFICATION_TIME = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  timeZone: "Asia/Seoul",
});

type NotificationRowProps = {
  notification: NotificationItem;
  onOpen: (notification: NotificationItem) => void;
  pending: boolean;
};

export function NotificationRow({ notification, onOpen, pending }: NotificationRowProps) {
  const unread = notification.read_at === null;
  const deleted = notification.record_id === null;
  const commentNotification = notification.event_type === "comment_created";
  const commentDeleted = commentNotification && notification.comment_id === null;
  const href = getNotificationHref(notification) ?? undefined;
  const link = !unread && href ? <PressLink href={href} /> : undefined;
  const message = commentNotification ? "댓글을 남겼어요" : "새 기록을 남겼어요";

  return (
    <ListRow
      aria-label={`${unread ? "읽지 않은 알림, " : ""}${notification.sender_name}님이 ${message}, ${notification.record_title}, ${
        deleted ? "삭제된 기록" : "기록 보기"
      }`}
      className={cn(
        "items-start py-4",
        unread &&
          "bg-primary/5 before:absolute before:top-4 before:bottom-4 before:left-0 before:w-0.5 before:rounded-full before:bg-primary",
      )}
      disabled={deleted || pending}
      nativeButton={!link}
      onClick={link ? undefined : () => onOpen(notification)}
      render={link}
      type={link ? undefined : "button"}
    >
      <span className="flex min-w-0 items-start gap-3">
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className={cn("text-foreground text-sm leading-5", unread && "font-semibold")}>
            <strong>{notification.sender_name}</strong>님이 {message}
          </span>
          <span className={cn("truncate text-base text-foreground", unread ? "font-bold" : "font-medium")}>
            {notification.record_title}
          </span>
          <span className="flex items-center gap-2 text-muted-foreground text-xs">
            <time dateTime={notification.created_at}>
              {NOTIFICATION_TIME.format(new Date(notification.created_at))}
            </time>
            {deleted ? <span>삭제된 기록이에요</span> : null}
            {!deleted && commentDeleted ? <span>삭제된 댓글이에요</span> : null}
          </span>
        </span>
        {deleted ? null : <CaretRightIcon aria-hidden="true" className="mt-1 shrink-0 text-muted-foreground" />}
      </span>
    </ListRow>
  );
}
