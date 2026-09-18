"use client";

import { format, parseISO } from "date-fns";

import { PressScale } from "@/shared/ui/press-scale";
import { RecordCreateButton } from "@/widgets/record-create-button";

type CalendarRecordCreateButtonProps = {
  date: string | null;
};

export function CalendarRecordCreateButton({ date }: CalendarRecordCreateButtonProps) {
  if (!date) return null;

  return (
    <PressScale className="pointer-events-auto inline-flex">
      <RecordCreateButton href={`/records/new?date=${date}`}>
        {format(parseISO(date), "M월 d일")} 기록 남기기
      </RecordCreateButton>
    </PressScale>
  );
}
