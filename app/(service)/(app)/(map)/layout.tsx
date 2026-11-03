import type { ReactNode } from "react";

import { MapDataPrefetch } from "@/app/providers/map-data-prefetch";

export default function MapLayout({ children }: { children: ReactNode }) {
  return <MapDataPrefetch>{children}</MapDataPrefetch>;
}
