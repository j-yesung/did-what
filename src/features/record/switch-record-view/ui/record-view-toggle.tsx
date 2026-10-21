"use client";

import { CalendarDotsIcon, ListBulletsIcon } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";

import { useActionOverride } from "@/shared/lib/action-override";
import { ICON_WEIGHT_MEDIUM } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { PressLink } from "@/shared/ui/press-link";

import { getRecordViewHref, type RecordView, saveRecordView } from "../model/record-view-preference";

export function RecordViewToggle({ view }: { view: RecordView }) {
  const searchParams = useSearchParams();
  const calendar = view !== "calendar";
  const nextView: RecordView = calendar ? "calendar" : "list";
  const saveView = useActionOverride(saveRecordView);

  return (
    <LiquidGlassButton
      aria-label={calendar ? "달력" : "목록"}
      className={cn("[&_svg]:size-6.75", ICON_WEIGHT_MEDIUM)}
      nativeButton={false}
      render={
        <PressLink
          href={getRecordViewHref(nextView, searchParams?.toString() ?? "")}
          onClick={() => saveView(nextView)}
          prefetch
        />
      }
      shape="circle"
    >
      {calendar ? (
        <CalendarDotsIcon data-icon="inline-start" weight="regular" />
      ) : (
        <ListBulletsIcon data-icon="inline-start" weight="regular" />
      )}
    </LiquidGlassButton>
  );
}
