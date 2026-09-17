"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";

import { useToolbarTapScale } from "@/shared/lib/use-toolbar-tap-scale";
import { NotificationBell } from "@/widgets/notification/notification-bell";
import { RecordCreateButton } from "@/widgets/record-create-button";

const TOOLBAR_ENTRY_PATHS = new Set(["/", "/regions", "/records", "/places", "/settings"]);

export function AppToolbar({ memberId }: { memberId: string }) {
  const pathname = usePathname() ?? "";

  const { handleTapCancel, handleTapEnd, handleTapStart, transform } = useToolbarTapScale();

  if (!TOOLBAR_ENTRY_PATHS.has(pathname)) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30">
      <div className="mx-auto flex w-full max-w-(--app-width) justify-end px-5 pt-[calc(24px+env(safe-area-inset-top))]">
        <motion.div
          aria-label="빠른 작업"
          className="app-toolbar liquid-glass liquid-glass-toolbar pointer-events-auto flex items-center gap-0.5 rounded-full border p-0.5"
          onTap={handleTapEnd}
          onTapCancel={handleTapCancel}
          onTapStart={handleTapStart}
          role="group"
          style={{ transform }}
        >
          <RecordCreateButton />
          <NotificationBell memberId={memberId} />
        </motion.div>
      </div>
    </div>
  );
}
