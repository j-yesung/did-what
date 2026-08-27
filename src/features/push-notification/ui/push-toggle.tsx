"use client";

import { Field, FieldDescription, FieldLabel } from "@/shared/ui/field";
import { Switch } from "@/shared/ui/switch";

import { usePushToggle } from "../model/use-push-toggle";

export function PushToggle() {
  const { checked, isUnsupported, handleCheckedChange } = usePushToggle();

  return (
    <fieldset>
      <legend className="mb-1 font-medium text-lg">알림</legend>

      {isUnsupported ? (
        <FieldDescription>
          이 브라우저에서는 알림을 받을 수 없어요. 홈 화면에 추가한 앱에서 열어 주세요.
        </FieldDescription>
      ) : (
        <Field orientation="horizontal">
          <FieldLabel className="min-h-11 items-center" htmlFor="push-switch">
            기록 알림
          </FieldLabel>
          <Switch checked={checked} id="push-switch" onCheckedChange={handleCheckedChange} />
        </Field>
      )}
    </fieldset>
  );
}
