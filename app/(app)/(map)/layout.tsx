import type { ReactNode } from "react";

import { PageShell } from "@/shared/ui/layouts";
import { MapSegment } from "@/widgets/map-segment";

export default function MapLayout({ children }: { children: ReactNode }) {
  return (
    <PageShell className="motion-safe:animate-none" withBottomNavigation>
      <MapSegment />
      {children}
    </PageShell>
  );
}
