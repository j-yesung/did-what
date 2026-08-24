"use client";

import { type FormEvent, useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { profileQueryOptions } from "@/entities/profile/api/profile-query";
import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { Button } from "@/shared/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";

import { fetchSubscriptionLabel } from "../api/subscription-label";
import { removeSubscription, saveSubscription } from "../model/actions";
import { disablePush, enablePush, getCurrentPushKeys, isPushSupported } from "../model/subscribe";

type ToggleState = "loading" | "off" | "on" | "unsupported";

const FALLBACK_NICKNAME = "기록자";

export function PushToggle() {
  const [state, setState] = useState<ToggleState>("loading");
  const [nickname, setNickname] = useState("");
  const [pending, setPending] = useState(false);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const profile = useQuery(profileQueryOptions);

  useEffect(() => {
    if (!isPushSupported()) {
      setState("unsupported");
      return;
    }

    getCurrentPushKeys().then(async (keys) => {
      if (!keys) {
        setState("off");
        return;
      }

      setNickname((await fetchSubscriptionLabel(keys.endpoint)) ?? "");
      setState("on");
    });
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

    // 켜자마자 이름을 묻지 않는다. 가입할 때 쓴 이름으로 시작하고, 아래에서 언제든 바꾼다.
    const label = profile.data?.trim() || FALLBACK_NICKNAME;
    const saved = await runServerAction(() => saveSubscription({ ...result.keys, label }));

    // 서버에 남지 않은 구독은 알림이 오지 않는다. 켜진 것처럼 보이지 않게 브라우저 구독도 되돌린다.
    if (saved?.status === "error") {
      await disablePush();
      toast.error("알림을 켜지 못했어요", { description: saved.message, duration: 4000 });
      return;
    }

    setNickname(label);
    setState("on");

    // 닉네임이 다른 기기와 겹치면 저장은 됐어도 그대로 두면 안 된다.
    if (saved?.message) {
      toast.warning("닉네임을 바꿔 주세요", { description: saved.message, duration: 6000 });
      return;
    }

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

  /** 닉네임은 기기마다 다르다. 지금 기기의 구독을 그대로 다시 저장해 label만 바꾼다. */
  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = String(new FormData(event.currentTarget).get("nickname") ?? "").trim();
    setSaving(true);

    try {
      const keys = await getCurrentPushKeys();

      if (!keys) {
        setState("off");
        toast.error("알림이 꺼져 있어요", { duration: 4000 });
        return;
      }

      const saved = await runServerAction(() => saveSubscription({ ...keys, label }));

      if (saved?.status === "error") {
        toast.error("닉네임을 바꾸지 못했어요", { description: saved.message, duration: 4000 });
        return;
      }

      setNickname(label);

      if (saved?.message) {
        toast.warning("닉네임을 바꿔 주세요", { description: saved.message, duration: 6000 });
        return;
      }

      toast.success("닉네임을 바꿨어요", { duration: 2000 });
    } catch {
      toast.error("닉네임을 바꾸지 못했어요", { duration: 4000 });
    } finally {
      setSaving(false);
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
        <div className="flex flex-col gap-4">
          <Field orientation="horizontal">
            <FieldLabel className="min-h-11 items-center" htmlFor="push-switch">
              새 기록 알림
            </FieldLabel>
            <Switch
              checked={optimistic ?? state === "on"}
              disabled={state === "loading"}
              id="push-switch"
              onCheckedChange={handleToggle}
            />
          </Field>

          {state === "on" ? (
            <form onSubmit={handleRename}>
              <Field>
                <FieldLabel htmlFor="push-nickname">닉네임</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    autoComplete="off"
                    className="h-11 flex-1"
                    defaultValue={nickname}
                    id="push-nickname"
                    key={nickname}
                    maxLength={50}
                    name="nickname"
                    required
                  />
                  <Button className="h-11 px-5" loading={saving} type="submit" variant="outline">
                    저장
                  </Button>
                </div>
                <FieldDescription>상대 기기의 알림에 이 이름이 표시돼요.</FieldDescription>
              </Field>
            </form>
          ) : (
            <FieldDescription>상대가 기록을 남기면 이 기기로 알려드려요. 기기마다 따로 켜야 해요.</FieldDescription>
          )}
        </div>
      )}
    </fieldset>
  );
}
