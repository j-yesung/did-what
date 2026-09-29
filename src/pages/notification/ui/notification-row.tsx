import { CaretRightIcon } from "@phosphor-icons/react";

import { getNotificationHref, type NotificationItem } from "@/entities/notification";
import { formatCommentTime } from "@/entities/record-comment";
import { cn } from "@/shared/lib/utils";
import { ListRow } from "@/shared/ui/list-row";
import { PressLink } from "@/shared/ui/press-link";

type NotificationRowProps = {
  notification: NotificationItem;
  onOpen: (notification: NotificationItem) => void;
};

export function NotificationRow({ notification, onOpen }: NotificationRowProps) {
  const unread = notification.read_at === null;
  const deleted = notification.record_id === null;
  const commentNotification = notification.event_type === "comment_created";
  const commentDeleted = commentNotification && notification.comment_id === null;
  const href = getNotificationHref(notification);
  const message = commentNotification ? "댓글을 남겼어요" : "새 기록을 남겼어요";

  return (
    <ListRow
      aria-label={`${unread ? "읽지 않은 알림, " : ""}${notification.sender_name}님이 ${message}, ${notification.record_title}, ${
        deleted ? "삭제된 기록" : "기록 보기"
      }`}
      className="items-start py-4"
      disabled={!href}
      nativeButton={!href}
      onClick={() => onOpen(notification)}
      render={href ? <PressLink href={href} /> : undefined}
      type={href ? undefined : "button"}
    >
      <span className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className={cn("mt-2 size-1.5 shrink-0 rounded-full", unread ? "bg-primary" : "bg-transparent")}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-foreground text-sm leading-5">
            {notification.sender_name}님이 {message}
          </span>
          <span className={cn("truncate text-base text-foreground", unread ? "font-semibold" : "font-normal")}>
            {notification.record_title}
          </span>
          <span className="flex items-center gap-2 text-muted-foreground text-xs">
            <time dateTime={notification.created_at} suppressHydrationWarning>
              {formatCommentTime(notification.created_at)}
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
