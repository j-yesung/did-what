"use client";

import { BellIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";

import { unreadNotificationCountQueryOptions } from "@/entities/notification";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { IconButton } from "@/shared/ui/icon-button";
import { PressLink } from "@/shared/ui/press-link";

type NotificationBellProps = {
  className?: string;
  memberId: string;
};

const NOTIFICATION_ENTRY_PATHS = new Set(["/", "/regions", "/records", "/places", "/settings"]);
const NOTIFICATION_BADGE_LIMIT = 9;

export function NotificationBell({ className, memberId }: NotificationBellProps) {
  const pathname = usePathname() ?? "";
  const visible = NOTIFICATION_ENTRY_PATHS.has(pathname);
  const unreadQuery = useQuery({ ...unreadNotificationCountQueryOptions(memberId), enabled: visible });
  const count = unreadQuery.data ?? 0;
  const badgeLabel =
    count > NOTIFICATION_BADGE_LIMIT ? `${NOTIFICATION_BADGE_LIMIT}+` : count > 0 ? String(count) : null;
  const accessibilityLabel = unreadQuery.isSuccess
    ? count > 0
      ? `알림함, 읽지 않은 알림 ${count}개`
      : "알림함, 읽지 않은 알림 없음"
    : "알림함";

  if (!visible) return null;

  return (
    <span className="relative inline-flex">
      <IconButton
        aria-label={accessibilityLabel}
        className={cn("liquid-glass rounded-full", className)}
        icon={BellIcon}
        iconSize={24}
        nativeButton={false}
        render={<PressLink href="/notifications" prefetch />}
        size="lg"
        variant="clear"
      />
      {badgeLabel ? (
        <Badge
          aria-hidden="true"
          className="absolute top-1 right-1 z-10 min-w-4 justify-center rounded-full px-1 py-0 text-[10px]"
          tone="danger"
        >
          {badgeLabel}
        </Badge>
      ) : null}
    </span>
  );
}
