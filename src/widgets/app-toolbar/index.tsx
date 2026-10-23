"use client";

import { usePathname } from "next/navigation";

import { RecordCreateButton } from "@/entities/record";
import { FixedToolbar } from "@/shared/ui/layouts";
import { PressScale } from "@/shared/ui/press-scale";
import { NotificationBell } from "@/widgets/app-toolbar/notification-bell";

import { RecordToolbarActions } from "./record-toolbar-actions";

const TOOLBAR_ENTRY_PATHS = new Set(["/", "/records", "/places", "/settings"]);

/** 기록 상세. 작성(/records/new)과 수정(/records/{id}/edit)은 한 가지 일만 하는 화면이라 뺀다. */
const RECORD_DETAIL_PATH = /^\/records\/(?!new$)[^/]+$/;

export function AppToolbar({ memberId }: { memberId: string }) {
  const pathname = usePathname() ?? "";

  if (!TOOLBAR_ENTRY_PATHS.has(pathname) && !RECORD_DETAIL_PATH.test(pathname)) return null;

  const recordId = RECORD_DETAIL_PATH.test(pathname) ? pathname.split("/")[2] : undefined;
  const primaryActions = (
    <>
      <RecordCreateButton className="size-12 [&_svg]:size-6" surface="group" />
      <NotificationBell memberId={memberId} />
    </>
  );

  return (
    <FixedToolbar className="items-start">
      {recordId ? (
        <div className="ml-auto">
          <RecordToolbarActions key={recordId} recordId={recordId}>
            {primaryActions}
          </RecordToolbarActions>
        </div>
      ) : (
        <PressScale
          aria-label="빠른 작업"
          className="app-toolbar liquid-glass-control pointer-events-auto ml-auto flex items-center gap-1 rounded-full p-0.5"
          role="group"
        >
          {primaryActions}
        </PressScale>
      )}
    </FixedToolbar>
  );
}
