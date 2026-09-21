"use client";

import { Fragment } from "react";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  getNotificationHref,
  NOTIFICATIONS_QUERY_KEY,
  type NotificationItem,
  notificationListQueryOptions,
  unreadNotificationCountQueryOptions,
} from "@/entities/notification";
import { readAllNotifications } from "@/features/notification/read-all-notifications";
import { readNotification } from "@/features/notification/read-notification";
import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { showToast } from "@/shared/lib/toast";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { PageHeader } from "@/shared/ui/layouts/page-header";
import { PageShell } from "@/shared/ui/layouts/page-shell";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { LoadMoreButton } from "@/shared/ui/load-more-button";
import { Separator } from "@/shared/ui/separator";
import { TextButton } from "@/shared/ui/text-button";

import { NotificationRow } from "./notification-row";

type NotificationListProps = {
  memberId: string;
};

export function NotificationList({ memberId }: NotificationListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const listQuery = useInfiniteQuery(notificationListQueryOptions(memberId));
  const unreadQuery = useQuery(unreadNotificationCountQueryOptions(memberId));

  const readOne = useMutation({
    mutationFn: (notification: NotificationItem) => runServerAction(() => readNotification(notification.id)),
    onSuccess: async (result, notification) => {
      if (result?.status === "error") {
        showToast({ description: result.message, title: "알림을 열지 못했어요", variant: "warning" });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const href = getNotificationHref(notification);
      if (href) router.push(href);
    },
    onError: () => showToast({ title: "알림을 열지 못했어요", variant: "error" }),
  });
  const readAll = useMutation({
    mutationFn: () => runServerAction(readAllNotifications),
    onSuccess: async (result) => {
      if (result?.status === "error") {
        showToast({ description: result.message, title: "모두 읽지 못했어요", variant: "warning" });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
    onError: () => showToast({ title: "모두 읽지 못했어요", variant: "error" }),
  });

  const openNotification = (notification: NotificationItem) => {
    const href = getNotificationHref(notification);
    if (!href || readOne.isPending || notification.read_at) return;

    readOne.mutate(notification);
  };

  const notifications = listQuery.data?.pages.flatMap((page) => page.notifications) ?? [];
  const unreadCount = unreadQuery.data ?? 0;

  return (
    <PageShell className="gap-6">
      <PageHeader
        action={
          unreadCount > 0 ? (
            <TextButton
              aria-busy={readAll.isPending || undefined}
              disabled={readAll.isPending}
              onClick={() => readAll.mutate()}
              size="sm"
              tone="brand"
              type="button"
            >
              모두 읽음
            </TextButton>
          ) : undefined
        }
        back="/"
        title="알림"
      />

      {listQuery.isPending ? null : listQuery.isError && !listQuery.data ? (
        <LoadErrorAlert
          icon={<WarningCircleIcon aria-hidden="true" />}
          onRetry={() => void listQuery.refetch()}
          retrying={listQuery.isFetching}
          title="알림을 불러오지 못했어요"
        />
      ) : notifications.length === 0 ? (
        <Empty className="border-0 py-12">
          <EmptyHeader className="gap-1">
            <EmptyTitle className="font-semibold text-base">새 알림이 없어요</EmptyTitle>
            <EmptyDescription className="text-sm/normal">새 기록과 댓글을 여기서 확인해요.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <section aria-label={`불러온 알림 ${notifications.length}개`} className="-mx-5">
          {notifications.map((notification, index) => (
            <Fragment key={notification.id}>
              <NotificationRow
                notification={notification}
                onOpen={openNotification}
                pending={readOne.isPending && readOne.variables?.id === notification.id}
              />
              {index < notifications.length - 1 ? <Separator /> : null}
            </Fragment>
          ))}
          {listQuery.hasNextPage ? (
            <LoadMoreButton
              error={listQuery.isFetchNextPageError ? "알림을 더 불러오지 못했어요." : undefined}
              loading={listQuery.isFetchingNextPage}
              onClick={() => listQuery.fetchNextPage()}
            />
          ) : null}
        </section>
      )}
    </PageShell>
  );
}
