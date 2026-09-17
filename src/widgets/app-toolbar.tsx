"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";

import { RecordViewToggle } from "@/features/record/switch-record-view";
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
      <div className="mx-auto flex w-full max-w-(--app-width) items-start px-5 pt-[calc(24px+env(safe-area-inset-top))]">
        {pathname === "/records" ? <RecordViewToggle /> : null}
        <motion.div
          aria-label="빠른 작업"
          className="app-toolbar pointer-events-auto relative isolate ml-auto flex items-center gap-0.5 overflow-hidden rounded-full border border-foreground/20 bg-[radial-gradient(ellipse_at_28%_8%,color-mix(in_oklab,var(--color-light)_32%,transparent),transparent_58%),radial-gradient(ellipse_at_72%_92%,color-mix(in_oklab,var(--color-dark)_10%,transparent),transparent_62%),linear-gradient(180deg,color-mix(in_oklab,var(--color-light)_18%,transparent)_0%,color-mix(in_oklab,var(--color-light)_8.5%,transparent)_45%,color-mix(in_oklab,var(--color-light)_6%,transparent)_100%)] p-0.5 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-light)_65%,transparent),inset_0_-1px_1px_color-mix(in_oklab,var(--color-dark)_10%,transparent),0_4px_12px_color-mix(in_oklab,var(--color-dark)_6%,transparent)] [-webkit-backdrop-filter:blur(5px)_saturate(145%)_brightness(1.08)] [backdrop-filter:blur(5px)_saturate(145%)_brightness(1.08)]"
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
