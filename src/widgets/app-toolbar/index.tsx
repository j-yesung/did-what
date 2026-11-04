"use client";

import { usePathname } from "next/navigation";

import { RecordCreateButton } from "@/entities/record";
import { FixedToolbar } from "@/shared/ui/layouts";
import { PressScale } from "@/shared/ui/press-scale";
import { NotificationBell } from "@/widgets/app-toolbar/notification-bell";

const TOOLBAR_ENTRY_PATHS = new Set(["/", "/records", "/places", "/settings"]);

export function AppToolbar({ memberId }: { memberId: string }) {
  const pathname = usePathname() ?? "";

  if (!TOOLBAR_ENTRY_PATHS.has(pathname)) return null;

  const primaryActions = (
    <>
      <RecordCreateButton className="size-11 [&_svg]:size-6" surface="group" />
      <NotificationBell memberId={memberId} />
    </>
  );

  return (
    <FixedToolbar className="items-start">
      <PressScale
        aria-label="빠른 작업"
        className="app-toolbar liquid-glass-control pointer-events-auto ml-auto flex items-center gap-1 rounded-full"
        role="group"
      >
        {primaryActions}
      </PressScale>
    </FixedToolbar>
  );
}
