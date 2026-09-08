"use client";

import { BellIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { unreadNotificationCountQueryOptions } from "@/entities/notification/api/queries";
import { useDelayedNavigate } from "@/shared/lib/navigation/use-delayed-navigate";
import { Badge } from "@/shared/ui/badge";
import { IconButton } from "@/shared/ui/icon-button";

type NotificationBellProps = {
  className?: string;
  memberId: string;
};

const NOTIFICATION_ENTRY_PATHS = new Set(["/", "/regions", "/records", "/places", "/settings"]);

export function NotificationBell({ className, memberId }: NotificationBellProps) {
  const delayedNavigate = useDelayedNavigate();
  const pathname = usePathname() ?? "";
  const visible = NOTIFICATION_ENTRY_PATHS.has(pathname);
  const unreadQuery = useQuery({ ...unreadNotificationCountQueryOptions(memberId), enabled: visible });
  const count = unreadQuery.data ?? 0;
  const badgeLabel = count > 9 ? "9+" : count > 0 ? String(count) : null;
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
        className={className}
        icon={BellIcon}
        iconSize={24}
        iconWeight={badgeLabel ? "fill" : "regular"}
        nativeButton={false}
        render={<Link href="/notifications" onClick={(event) => delayedNavigate(event, "/notifications")} prefetch />}
        size="lg"
        variant="clear"
      />
      {badgeLabel ? (
        <Badge
          aria-hidden="true"
          className="absolute -top-1 -right-1 min-w-4 justify-center rounded-full px-1 py-0 text-[10px]"
          tone="primary"
        >
          {badgeLabel}
        </Badge>
      ) : null}
    </span>
  );
}
