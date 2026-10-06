"use client";

import { usePathname } from "next/navigation";

import { RecordCreateButton } from "@/entities/record";
import { PressScale } from "@/shared/ui/press-scale";
import { NotificationBell } from "@/widgets/app-toolbar/notification-bell";

const TOOLBAR_ENTRY_PATHS = new Set(["/", "/records", "/places", "/settings"]);

/** 기록 상세. 작성(/records/new)과 수정(/records/{id}/edit)은 한 가지 일만 하는 화면이라 뺀다. */
const RECORD_DETAIL_PATH = /^\/records\/(?!new$)[^/]+$/;

export function AppToolbar({ memberId }: { memberId: string }) {
  const pathname = usePathname() ?? "";

  if (!TOOLBAR_ENTRY_PATHS.has(pathname) && !RECORD_DETAIL_PATH.test(pathname)) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30">
      <div className="mx-auto flex w-full max-w-(--app-width) items-start px-5 pt-(--page-top)">
        <PressScale
          aria-label="빠른 작업"
          className="app-toolbar liquid-glass-control pointer-events-auto ml-auto flex items-center gap-1.5 rounded-full p-0.5"
          role="group"
        >
          <RecordCreateButton className="size-12 [&_svg]:size-6" surface="group" />
          <NotificationBell memberId={memberId} />
        </PressScale>
      </div>
    </div>
  );
}
