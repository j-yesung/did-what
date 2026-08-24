"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { Field, FieldDescription, FieldLabel } from "@/shared/ui/field";
import { Spinner } from "@/shared/ui/spinner";
import { Switch } from "@/shared/ui/switch";

import { removeSubscription, saveSubscription } from "../model/actions";
import { disablePush, enablePush, getPushEndpoint, isPushSupported } from "../model/subscribe";

type ToggleState = "loading" | "off" | "on" | "unsupported";

export function PushToggle() {
  const [state, setState] = useState<ToggleState>("loading");
  const [pending, setPending] = useState(false);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isPushSupported()) {
      setState("unsupported");
      return;
    }

    getPushEndpoint().then((endpoint) => setState(endpoint ? "on" : "off"));
  }, []);

  async function turnOn() {
    const result = await enablePush();

    if (result.status === "unsupported") {
      setState("unsupported");
      return;
    }

    if (result.status === "denied") {
      toast.error("알림이 차단돼 있어요", {
        description: "브라우저나 기기 설정에서 이 사이트의 알림을 허용해 주세요.",
        duration: 6000,
      });
      return;
    }

    if (result.status === "dismissed") {
      toast.error("알림 권한을 받지 못했어요", {
        description: "권한 창이 뜨지 않으면 브라우저의 알림 설정에서 직접 허용해 주세요.",
        duration: 6000,
      });
      return;
    }

    const saved = await runServerAction(() => saveSubscription(result.keys));

    // 서버에 남지 않은 구독은 알림이 오지 않는다. 켜진 것처럼 보이지 않게 브라우저 구독도 되돌린다.
    if (saved?.status === "error") {
      await disablePush();
      toast.error("알림을 켜지 못했어요", { description: saved.message, duration: 4000 });
      return;
    }

    setState("on");
    toast.success("이 기기로 알림을 받아요", { duration: 2000 });
  }

  async function turnOff() {
    const endpoint = await disablePush();
    if (endpoint) await runServerAction(() => removeSubscription(endpoint));

    setState("off");
    toast.success("알림을 껐어요", { duration: 2000 });
  }

  /**
   * 권한 창이 떠 있는 동안 스위치가 굳어 있으면 눌리지 않은 것처럼 보인다.
   * 먼저 움직여 두고, 실패하면 state가 그대로라 저절로 되돌아온다.
   */
  async function handleToggle(checked: boolean) {
    if (pending) return;

    setOptimistic(checked);
    setPending(true);

    try {
      await (checked ? turnOn() : turnOff());
    } catch {
      toast.error(checked ? "알림을 켜지 못했어요" : "알림을 끄지 못했어요", { duration: 4000 });
    } finally {
      setPending(false);
      setOptimistic(null);
    }
  }

  return (
    <fieldset>
      <legend className="mb-1 font-medium text-sm">알림</legend>

      {state === "unsupported" ? (
        <FieldDescription>
          이 브라우저에서는 알림을 받을 수 없어요. 홈 화면에 추가한 앱에서 열어 주세요.
        </FieldDescription>
      ) : (
        <Field orientation="horizontal">
          <FieldLabel className="min-h-11 items-center" htmlFor="push-switch">
            새 기록 알림
          </FieldLabel>
          {pending ? (
            <Spinner
              aria-label="알림을 설정하는 중"
              className="motion-safe:fade-in text-muted-foreground motion-safe:animate-in motion-safe:fill-mode-both motion-safe:delay-300"
            />
          ) : null}
          <Switch
            checked={optimistic ?? state === "on"}
            disabled={state === "loading"}
            id="push-switch"
            onCheckedChange={handleToggle}
          />
        </Field>
      )}
    </fieldset>
  );
}
