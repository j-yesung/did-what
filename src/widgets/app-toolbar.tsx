"use client";

import { usePathname } from "next/navigation";

import { RecordViewToggle } from "@/features/record/switch-record-view";
import { MapViewToggle } from "@/features/switch-map-view";
import { PressScale } from "@/shared/ui/press-scale";
import { NotificationBell } from "@/widgets/notification/notification-bell";
import { RecordCreateButton } from "@/widgets/record-create-button";

const TOOLBAR_ENTRY_PATHS = new Set(["/", "/regions", "/records", "/places", "/settings"]);

export function AppToolbar({ memberId }: { memberId: string }) {
  const pathname = usePathname() ?? "";

  if (!TOOLBAR_ENTRY_PATHS.has(pathname)) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30">
      <div className="mx-auto flex w-full max-w-(--app-width) items-start px-5 pt-[calc(24px+env(safe-area-inset-top))]">
        {pathname === "/" || pathname === "/regions" ? <MapViewToggle /> : null}
        {pathname === "/records" ? <RecordViewToggle /> : null}
        <PressScale
          aria-label="press scale"
          className="app-toolbar liquid-glass liquid-glass-toolbar pointer-events-auto relative isolate ml-auto flex items-center gap-0.5 overflow-hidden rounded-full border p-0.5"
          role="group"
        >
          <RecordCreateButton />
          <NotificationBell memberId={memberId} />
        </PressScale>
      </div>
    </div>
  );
}
