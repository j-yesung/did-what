import type { ReactNode } from "react";

import { MapDataPrefetch } from "@/app/providers/map-data-prefetch";
import { PageShell } from "@/shared/ui/layouts";

export default function MapLayout({ children }: { children: ReactNode }) {
  return (
    <MapDataPrefetch>
      {/* 상태 표시줄 밑까지 콘텐츠를 올리면 iOS 홈 화면 앱은 svh에서 그 높이를 빼 둔다. 지도가 아래 끝까지 닿도록 다시 더한다. */}
      <PageShell
        className="min-h-[calc(100svh+env(safe-area-inset-top))] motion-safe:animate-none"
        withBottomNavigation
      >
        <div aria-hidden="true" className="h-(--toolbar-height) shrink-0" />
        {children}
      </PageShell>
    </MapDataPrefetch>
  );
}
