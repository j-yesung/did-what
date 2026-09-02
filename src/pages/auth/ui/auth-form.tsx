"use client";

import { EnvelopeSimpleOpenIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";

import { INITIAL_AUTH_STATE, login, signup } from "@/features/auth";
import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardFooter } from "@/shared/ui/card";
import { FieldGroup } from "@/shared/ui/field";
import { TextButton } from "@/shared/ui/text-button";

import { EmailField } from "./fields/email-field";
import { NicknameField } from "./fields/nickname-field";
import { PasswordConfirmField } from "./fields/password-confirm-field";
import { PasswordField } from "./fields/password-field";

const AUTH_MODE_CONFIG = {
  login: {
    linkHref: "/signup",
    linkLabel: "처음이신가요? 회원가입",
    submitLabel: "로그인",
  },
  signup: {
    linkHref: "/login",
    linkLabel: "이미 계정이 있나요? 로그인",
    submitLabel: "회원가입",
  },
} as const;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const config = AUTH_MODE_CONFIG[mode];

  const submit = useMutation({
    mutationFn: (formData: FormData) => runServerAction(() => (isSignup ? signup : login)(formData)),
  });

  const state = submit.data ?? INITIAL_AUTH_STATE;

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-5 pt-[calc(40px+env(safe-area-inset-top))] pb-[calc(40px+env(safe-area-inset-bottom))]">
      <section className="flex w-full max-w-(--app-width) flex-col gap-6" aria-labelledby="auth-title">
        <h1 className="text-center font-bold text-2xl text-foreground tracking-[-0.03em]" id="auth-title">
          뭐했지
        </h1>

        <Card>
          <CardContent>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submit.mutate(new FormData(event.currentTarget));
              }}
            >
              <FieldGroup>
                {state.message ? (
                  <Alert variant={state.status === "error" ? "destructive" : "default"}>
                    {state.status === "error" ? (
                      <WarningCircleIcon strokeWidth={2} aria-hidden="true" />
                    ) : (
                      <EnvelopeSimpleOpenIcon strokeWidth={2} aria-hidden="true" />
                    )}
                    <AlertTitle>{state.status === "error" ? "확인해 주세요" : "메일을 확인해 주세요"}</AlertTitle>
                    <AlertDescription>{state.message}</AlertDescription>
                  </Alert>
                ) : null}

                <EmailField error={state.fieldErrors?.email} />
                <PasswordField error={state.fieldErrors?.password} isSignup={isSignup} />
                {isSignup ? <PasswordConfirmField error={state.fieldErrors?.passwordConfirm} /> : null}
                {isSignup ? <NicknameField error={state.fieldErrors?.displayName} /> : null}

                <Button className="mt-1" fullWidth loading={submit.isPending} size="large" type="submit">
                  {config.submitLabel}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>

          <CardFooter className="justify-center py-3">
            <TextButton nativeButton={false} render={<Link href={config.linkHref} />} tone="muted">
              {config.linkLabel}
            </TextButton>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
