"use client";

import { BellIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { unreadNotificationCountQueryOptions } from "@/entities/notification";
import { ICON_WEIGHT_MEDIUM } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
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
    <span className="relative inline-flex">
      <IconButton
        aria-label={accessibilityLabel}
        className={cn("size-12 rounded-full text-foreground", ICON_WEIGHT_MEDIUM)}
        icon={BellIcon}
        iconSize={24}
        iconWeight="regular"
        nativeButton={false}
        render={<PressLink href="/notifications" prefetch />}
        size="lg"
        variant="clear"
      />
      {/* 버튼 모서리가 아니라 종 그림의 오른쪽 어깨에 붙인다. 떨어져 있으면 알림의 표시로 읽히지 않는다. */}
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-3 right-3.5 size-2 rounded-full bg-primary"
        />
      ) : null}
    </span>
  );
}
