"use client";

import { CalendarDotsIcon, ListBulletsIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";

import { useToolbarTapScale } from "@/shared/lib/use-toolbar-tap-scale";
import { IconButton } from "@/shared/ui/icon-button";
import { PressLink } from "@/shared/ui/press-link";

import { type RecordView, saveRecordView } from "../model/record-view-preference";

export function RecordViewToggle() {
  const searchParams = useSearchParams();

  const calendar = searchParams?.get("view") !== "calendar";
  const nextView: RecordView = calendar ? "calendar" : "list";

  const { handleTapCancel, handleTapEnd, handleTapStart, transform } = useToolbarTapScale();

  return (
    <motion.div
      className="app-toolbar liquid-glass liquid-glass-toolbar pointer-events-auto inline-flex rounded-full border p-0.5"
      onTap={handleTapEnd}
      onTapCancel={handleTapCancel}
      onTapStart={handleTapStart}
      style={{ transform }}
    >
      <IconButton
        aria-label={calendar ? "달력" : "목록"}
        className="rounded-full text-foreground active:bg-transparent active:after:opacity-0"
        icon={calendar ? CalendarDotsIcon : ListBulletsIcon}
        iconSize={22}
        nativeButton={false}
        render={
          <PressLink
            href={calendar ? "/records?view=calendar" : "/records"}
            onClick={() => saveRecordView(nextView)}
            prefetch
          />
        }
        variant="clear"
      />
    </motion.div>
  );
}
