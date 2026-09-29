import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { requireMember } from "@/entities/member/server";
import {
  fetchNotificationPage,
  fetchUnreadNotificationCount,
  notificationListQueryOptions,
  unreadNotificationCountQueryOptions,
} from "@/entities/notification";
import { createQueryClient } from "@/shared/lib/react-query/query-client";
import { OverscrollBack } from "@/shared/ui/overscroll-back";

import { NotificationList } from "./ui/notification-list";

export async function NotificationPage() {
  const { member, supabase } = await requireMember();
  const queryClient = createQueryClient();

  // 목록과 '모두 읽음' 버튼이 첫 화면에 함께 보이도록 서버에서 먼저 받는다.
  await Promise.all([
    queryClient.prefetchInfiniteQuery({
      ...notificationListQueryOptions(member.id),
      queryFn: () => fetchNotificationPage(supabase, member.id, null),
    }),
    queryClient.prefetchQuery({
      ...unreadNotificationCountQueryOptions(member.id),
      queryFn: () => fetchUnreadNotificationCount(supabase, member.id),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OverscrollBack fallbackHref="/">
        <NotificationList memberId={member.id} />
      </OverscrollBack>
    </HydrationBoundary>
  );
}
