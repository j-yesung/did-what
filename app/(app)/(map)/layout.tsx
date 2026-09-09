import type { ReactNode } from "react";

import { MapDataPrefetch } from "@/app/providers/map-data-prefetch";
import { PageShell } from "@/shared/ui/layouts";
import { MapSegment } from "@/widgets/map-segment";

export default function MapLayout({ children }: { children: ReactNode }) {
  return (
    <MapDataPrefetch>
      <PageShell className="motion-safe:animate-none" withBottomNavigation>
        <MapSegment />
        {children}
      </PageShell>
    </MapDataPrefetch>
  );
}
