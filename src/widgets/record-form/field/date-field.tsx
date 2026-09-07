"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { ko } from "react-day-picker/locale";

import { format, parseISO } from "date-fns";

import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/shared/ui/drawer";
import { Field, FieldError, FieldLegend, FieldSet } from "@/shared/ui/field";

type RecordDateFieldProps = {
  defaultRecordedAt: string;
  initialRecordedAt?: string;
  initialRecordedUntil?: string | null;
  onValueChange?: (recordedAt: string, recordedUntil: string) => void;
  recordedAtError?: string;
  recordedUntilError?: string;
};

export function RecordDateField({
  defaultRecordedAt,
  initialRecordedAt,
  initialRecordedUntil,
  onValueChange,
  recordedAtError,
  recordedUntilError,
}: RecordDateFieldProps) {
  const firstRecordedAt = initialRecordedAt ?? defaultRecordedAt;
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: parseISO(firstRecordedAt),
    to: parseISO(initialRecordedUntil ?? firstRecordedAt),
  }));
  const [draftDateRange, setDraftDateRange] = useState<DateRange>();
  const selectedStart = dateRange.from ?? parseISO(firstRecordedAt);
  const selectedEnd = dateRange.to ?? selectedStart;
  const recordedAt = format(selectedStart, "yyyy-MM-dd");
  const recordedUntil = format(selectedEnd, "yyyy-MM-dd");
  const hasError = Boolean(recordedAtError || recordedUntilError);

  return (
    <FieldSet>
      <FieldLegend variant="label">언제</FieldLegend>
      <Field data-invalid={hasError}>
        <Drawer
          onOpenChange={(open) => {
            setDatePickerOpen(open);
            if (open) setDraftDateRange(dateRange);
          }}
          open={datePickerOpen}
          showSwipeHandle
        >
          <DrawerTrigger
            render={
              <Button
                className="justify-start [&>span]:w-full"
                fullWidth
                size="field"
                type="button"
                variant="outline"
                aria-invalid={hasError}
                aria-describedby={hasError ? "record-date-error" : undefined}
              />
            }
          >
            <span className="flex w-full items-center justify-between gap-3">
              <span>{recordedAt === recordedUntil ? recordedAt : `${recordedAt} ~ ${recordedUntil}`}</span>
              <span className="shrink-0 text-muted-foreground text-xs">기간 설정</span>
            </span>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>언제 갔나요?</DrawerTitle>
            </DrawerHeader>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              <Calendar
                className="w-full rounded-xl"
                classNames={{ root: "w-full" }}
                defaultMonth={draftDateRange?.from ?? selectedStart}
                fixedWeeks
                locale={ko}
                mode="range"
                onSelect={setDraftDateRange}
                selected={draftDateRange}
              />
            </div>

            <DrawerFooter className="pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
              <Button
                disabled={!draftDateRange?.from}
                fullWidth
                onClick={() => {
                  if (!draftDateRange?.from) return;
                  const nextRange = { from: draftDateRange.from, to: draftDateRange.to ?? draftDateRange.from };
                  setDateRange(nextRange);
                  onValueChange?.(format(nextRange.from, "yyyy-MM-dd"), format(nextRange.to, "yyyy-MM-dd"));
                  setDatePickerOpen(false);
                }}
                size="large"
                type="button"
              >
                적용
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <input name="recordedAt" type="hidden" value={recordedAt} />
        <input name="recordedUntil" type="hidden" value={recordedUntil} />
        <FieldError id="record-date-error">{recordedAtError ?? recordedUntilError}</FieldError>
      </Field>
    </FieldSet>
  );
}
