"use client";

import { CalendarDotsIcon, ListBulletsIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";

import { useToolbarTapScale } from "@/shared/lib/use-toolbar-tap-scale";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { PressLink } from "@/shared/ui/press-link";

import { type RecordView, saveRecordView } from "../model/record-view-preference";

export function RecordViewToggle() {
  const searchParams = useSearchParams();

  const calendar = searchParams?.get("view") !== "calendar";
  const nextView: RecordView = calendar ? "calendar" : "list";

  const { handleTapCancel, handleTapEnd, handleTapStart, transform } = useToolbarTapScale();

  return (
    <motion.div
      className="pointer-events-auto inline-flex"
      onTap={handleTapEnd}
      onTapCancel={handleTapCancel}
      onTapStart={handleTapStart}
      style={{ transform }}
    >
      <LiquidGlassButton
        aria-label={calendar ? "달력" : "목록"}
        className="active:scale-100"
        nativeButton={false}
        render={
          <PressLink
            href={calendar ? "/records?view=calendar" : "/records"}
            onClick={() => saveRecordView(nextView)}
            prefetch
          />
        }
        shape="circle"
      >
        {calendar ? <CalendarDotsIcon data-icon="inline-start" /> : <ListBulletsIcon data-icon="inline-start" />}
      </LiquidGlassButton>
    </motion.div>
  );
}
