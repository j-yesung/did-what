"use client";

import { CalendarDotsIcon, ListBulletsIcon } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";

import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { PressLink } from "@/shared/ui/press-link";
import { PressScale } from "@/shared/ui/press-scale";

import { type RecordView, saveRecordView } from "../model/record-view-preference";

export function RecordViewToggle() {
  const searchParams = useSearchParams();

  const calendar = searchParams?.get("view") !== "calendar";
  const nextView: RecordView = calendar ? "calendar" : "list";

  return (
    <PressScale className="pointer-events-auto inline-flex">
      <LiquidGlassButton
        aria-label={calendar ? "달력" : "목록"}
        className="liquid-glass liquid-glass-toolbar active:scale-100"
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
    </PressScale>
  );
}
