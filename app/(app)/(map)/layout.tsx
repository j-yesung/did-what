import type { ReactNode } from "react";

import { MapDataPrefetch } from "@/app/providers/map-data-prefetch";
import { PageShell } from "@/shared/ui/layouts";

export default function MapLayout({ children }: { children: ReactNode }) {
  return (
    <MapDataPrefetch>
      <PageShell className="motion-safe:animate-none" withBottomNavigation>
        <div aria-hidden="true" className="h-13 shrink-0" />
        {children}
      </PageShell>
    </MapDataPrefetch>
  );
}
