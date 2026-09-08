import { requireMember } from "@/entities/member/server";
import { OverscrollBack } from "@/shared/ui/overscroll-back";

import { NotificationList } from "./notification-list";

export async function NotificationPage() {
  const { member } = await requireMember();

  return (
    <OverscrollBack fallbackHref="/">
      <NotificationList memberId={member.id} />
    </OverscrollBack>
  );
}
