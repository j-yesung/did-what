import type { ReactNode } from "react";

import { PageShell } from "@/shared/ui/layouts";
import { MapSegment } from "@/widgets/map-segment";

/** 지도·지역은 한 탭의 두 세그먼트라 세그먼트를 layout에 둔다. 라우트가 바뀌어도 남아 있어야 인디케이터가 미끄러진다. */
export default function MapLayout({ children }: { children: ReactNode }) {
  return (
    <PageShell withBottomNavigation>
      <MapSegment />
      {children}
    </PageShell>
  );
}
