"use client";

import { Fragment } from "react";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  NOTIFICATIONS_QUERY_KEY,
  type NotificationItem,
  notificationListQueryOptions,
  unreadNotificationCountQueryOptions,
} from "@/entities/notification";
import { readAllNotifications } from "@/features/notification/read-all-notifications";
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
  const queryClient = useQueryClient();
  const listOptions = notificationListQueryOptions(memberId);
  const unreadOptions = unreadNotificationCountQueryOptions(memberId);
  const listQuery = useInfiniteQuery(listOptions);
  const unreadQuery = useQuery(unreadOptions);
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

  /**
   * 알림을 누르면 기다리지 않고 바로 기록으로 간다. 읽음 처리는 기록 상세가 서버에 보내고,
   * 여기서는 돌아왔을 때 바로 읽은 모습이 보이도록 같은 기록의 알림을 캐시에서 먼저 바꾼다.
   */
  const markRecordRead = (notification: NotificationItem) => {
    if (notification.read_at || !notification.record_id) return;

    const readAt = new Date().toISOString();
    let readCount = 0;
    queryClient.setQueryData(listOptions.queryKey, (data) =>
      data
        ? {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              notifications: page.notifications.map((item) => {
                if (item.read_at || item.record_id !== notification.record_id) return item;
                readCount += 1;
                return { ...item, read_at: readAt };
              }),
            })),
          }
        : data,
    );
    queryClient.setQueryData(unreadOptions.queryKey, (count) =>
      count === undefined ? count : Math.max(0, count - readCount),
    );
  };

  const notifications = listQuery.data?.pages.flatMap((page) => page.notifications) ?? [];
  const unreadCount = unreadQuery.data ?? 0;

  return (
    <PageShell className="gap-6">
      <h1 className="sr-only">알림</h1>
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
              <NotificationRow notification={notification} onOpen={markRecordRead} />
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
