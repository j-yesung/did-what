import { MapPinIcon } from "@phosphor-icons/react/dist/ssr";

import { buttonVariants } from "@/shared/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { PageShell } from "@/shared/ui/layouts";
import { PressLink } from "@/shared/ui/press-link";

export function AppNotFound() {
  return (
    <PageShell className="items-center justify-center" withBottomNavigation>
      <Empty className="border bg-card py-14">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPinIcon strokeWidth={2} aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>찾을 수 없는 화면이에요</EmptyTitle>
          <EmptyDescription>주소가 바뀌었거나 기록이 삭제되었을 수 있어요.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <PressLink className={buttonVariants({ size: "medium" })} href="/">
            지도로 가기
          </PressLink>
        </EmptyContent>
      </Empty>
    </PageShell>
  );
}
