"use client";

import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@/shared/ui/field";
import { Switch } from "@/shared/ui/switch";

import { usePushToggle } from "../model/use-push-toggle";

export function PushToggle() {
  const { checked, isUnsupported, handleCheckedChange } = usePushToggle();

  return (
    <FieldSet className="gap-0">
      <FieldLegend>알림</FieldLegend>

      {isUnsupported ? (
        <FieldDescription>알림을 받으려면 홈 화면에 추가한 앱에서 열어 주세요.</FieldDescription>
      ) : (
        <Field orientation="horizontal">
          <FieldLabel className="min-h-11 items-center" htmlFor="push-switch">
            기록 알림
          </FieldLabel>
          <Switch checked={checked} id="push-switch" onCheckedChange={handleCheckedChange} />
        </Field>
      )}
    </FieldSet>
  );
}
