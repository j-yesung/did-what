"use client";

import { useState, useTransition } from "react";

import NumberFlow from "@number-flow/react";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import { getDaysInMonth } from "date-fns";
import { useRouter } from "next/navigation";

import { countDaysSince } from "@/shared/lib/date/count-days";
import { formatRecordDate } from "@/shared/lib/date/format-date";
import { getToday } from "@/shared/lib/date/get-today";
import { useDemoOverride } from "@/shared/lib/demo-override";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { FieldDescription, FieldLegend, FieldSet } from "@/shared/ui/field";
import { IconButton } from "@/shared/ui/icon-button";
import { WheelPicker, WheelPickerGroup } from "@/shared/ui/wheel-picker";

import { saveMetOn } from "../api/actions";

const FIRST_YEAR = 1970;

const range = (from: number, to: number, label: string) =>
  Array.from({ length: to - from + 1 }, (_, index) => ({ label: `${from + index}${label}`, value: from + index }));

const toIsoDate = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export function MetOnSetting({ metOn }: { metOn: string | null }) {
  const today = getToday();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(metOn ?? today);
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();
  const router = useRouter();
  const save = useDemoOverride(saveMetOn);
  const [year, month, day] = draft.split("-").map(Number);
  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);

  const changeDraft = (next: { day?: number; month?: number; year?: number }) => {
    const nextYear = next.year ?? year;
    const nextMonth = next.month ?? month;
    const nextDay = Math.min(next.day ?? day, getDaysInMonth(new Date(nextYear, nextMonth - 1)));
    const date = toIsoDate(nextYear, nextMonth, nextDay);
    setDraft(date > today ? today : date);
    setError("");
  };

  const openSheet = () => {
    setDraft(metOn ?? today);
    setError("");
    setOpen(true);
  };

  const submit = () =>
    startSaving(async () => {
      const result = await save(draft);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });

  return (
    <FieldSet className="scroll-mt-24" id="met-on">
      <FieldLegend>우리가 만난 날</FieldLegend>
      <div className="flex items-center gap-3">
        <p className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-semibold text-[17px]">
            {metOn ? formatRecordDate(metOn) : "아직 정하지 않았어요"}
          </span>
          {metOn ? (
            <span className="text-[13px] text-muted-foreground">
              오늘로 <NumberFlow value={countDaysSince(metOn, today)} />
              일째예요
            </span>
          ) : null}
        </p>
        <IconButton
          aria-label={metOn ? "만난 날 수정" : "만난 날 등록"}
          className="-mr-2.25"
          icon={PencilSimpleIcon}
          iconSize={20}
          onClick={openSheet}
          type="button"
        />
      </div>
      <BottomSheet onOpenChange={setOpen} open={open} showSwipeHandle>
        <BottomSheet.Content>
          <BottomSheet.Header>
            <BottomSheet.Title className="text-left font-bold text-xl">우리가 처음 만난 날</BottomSheet.Title>
            <BottomSheet.Description className="mt-2 flex items-baseline justify-between gap-3 text-left">
              <span>{formatRecordDate(draft)}</span>
              <span className="whitespace-nowrap">
                함께한 지{" "}
                <span className="font-bold text-accent-text">
                  <NumberFlow value={countDaysSince(draft, today)} />
                  일째
                </span>
              </span>
            </BottomSheet.Description>
          </BottomSheet.Header>
          <div className="px-5 pt-4 pb-7">
            <WheelPickerGroup aria-label="우리가 처음 만난 날">
              <WheelPicker
                aria-label="연도"
                className="flex-[1.3]"
                onValueChange={(value) => changeDraft({ year: value })}
                options={range(FIRST_YEAR, todayYear, "년")}
                value={year}
              />
              <WheelPicker
                aria-label="월"
                infinite
                onValueChange={(value) => changeDraft({ month: value })}
                options={range(1, year === todayYear ? todayMonth : 12, "월")}
                value={month}
              />
              <WheelPicker
                aria-label="일"
                infinite
                onValueChange={(value) => changeDraft({ day: value })}
                options={range(
                  1,
                  year === todayYear && month === todayMonth ? todayDay : getDaysInMonth(new Date(year, month - 1)),
                  "일",
                )}
                value={day}
              />
            </WheelPickerGroup>
            {error ? (
              <FieldDescription className="mt-3 text-destructive" role="alert">
                {error}
              </FieldDescription>
            ) : null}
            <Button
              className="mt-4"
              disabled={draft === metOn}
              fullWidth
              loading={saving}
              onClick={submit}
              size="large"
              type="button"
            >
              저장
            </Button>
          </div>
        </BottomSheet.Content>
      </BottomSheet>
    </FieldSet>
  );
}
