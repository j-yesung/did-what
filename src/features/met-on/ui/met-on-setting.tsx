"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { formatRecordDate } from "@/shared/lib/date/format-date";
import { getToday } from "@/shared/lib/date/get-today";
import { useDemoOverride } from "@/shared/lib/demo-override";
import { Button } from "@/shared/ui/button";
import { DateInput } from "@/shared/ui/date-input";
import { FieldDescription, FieldLegend, FieldSet } from "@/shared/ui/field";

import { saveMetOn } from "../api/actions";

export function MetOnSetting({ metOn }: { metOn: string | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(metOn ?? "");
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();
  const router = useRouter();
  const save = useDemoOverride(saveMetOn);

  const startEditing = () => {
    setValue(metOn ?? "");
    setError("");
    setEditing(true);
  };

  const submit = () =>
    startSaving(async () => {
      const result = await save(value);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });

  return (
    <FieldSet className="scroll-mt-24" id="met-on">
      <FieldLegend>우리가 만난 날</FieldLegend>
      {editing ? (
        <>
          <DateInput
            aria-describedby={error ? "met-on-error" : undefined}
            aria-invalid={Boolean(error)}
            aria-label="우리가 만난 날"
            disabled={saving}
            max={getToday()}
            onChange={(event) => {
              setValue(event.target.value);
              setError("");
            }}
            placeholder="날짜를 골라 주세요"
            value={value}
          />
          {error && (
            <FieldDescription className="text-destructive" id="met-on-error" role="alert">
              {error}
            </FieldDescription>
          )}
          <div className="flex justify-end gap-2">
            <Button
              disabled={saving}
              onClick={() => setEditing(false)}
              size="medium"
              type="button"
              variant="weak"
              color="dark"
            >
              취소
            </Button>
            <Button disabled={!value || value === metOn} loading={saving} onClick={submit} size="medium" type="button">
              저장
            </Button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3">
          <p className="min-w-0 flex-1 truncate text-sm">{metOn ? formatRecordDate(metOn) : "아직 정하지 않았어요"}</p>
          <Button onClick={startEditing} size="small" type="button" variant="outline">
            {metOn ? "수정" : "등록"}
          </Button>
        </div>
      )}
    </FieldSet>
  );
}
