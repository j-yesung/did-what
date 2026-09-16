"use client";

import { BellIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { unreadNotificationCountQueryOptions } from "@/entities/notification";
import { IconButton } from "@/shared/ui/icon-button";
import { PressLink } from "@/shared/ui/press-link";

type NotificationBellProps = {
  memberId: string;
};

export function NotificationBell({ memberId }: NotificationBellProps) {
  const unreadQuery = useQuery(unreadNotificationCountQueryOptions(memberId));

  const count = unreadQuery.data ?? 0;
  const accessibilityLabel = count > 0 ? "새 알림 있음" : "알림";

  return (
    <IconButton
      aria-label={accessibilityLabel}
      className="rounded-full text-foreground"
      icon={BellIcon}
      iconSize={22}
      nativeButton={false}
      render={<PressLink href="/notifications" prefetch />}
      variant="clear"
    />
  );
}
