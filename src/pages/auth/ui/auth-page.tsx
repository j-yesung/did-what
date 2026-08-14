"use client";

import type { FormEvent } from "react";

import { useMutation } from "@tanstack/react-query";
import { CircleAlertIcon, MailCheckIcon } from "lucide-react";
import Link from "next/link";

import { INITIAL_AUTH_STATE, login, signup } from "@/features/auth";
import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardFooter } from "@/shared/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { TextButton } from "@/shared/ui/text-button";

type AuthPageProps = {
  mode: "login" | "signup";
};

const COPY = {
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

function AuthPage({ mode }: AuthPageProps) {
  const isSignup = mode === "signup";
  const copy = COPY[mode];
  /**
   * 이 화면만 토스트를 쓰지 않는다. "메일을 확인해 주세요" 같은 안내는 사라지면 안 되고,
   * 아직 로그인 전이라 화면에 남길 자리도 카드 안뿐이다.
   */
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
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                submit.mutate(new FormData(event.currentTarget));
              }}
            >
              <FieldGroup>
                {state.message ? (
                  <Alert variant={state.status === "error" ? "destructive" : "default"}>
                    {state.status === "error" ? (
                      <CircleAlertIcon aria-hidden="true" />
                    ) : (
                      <MailCheckIcon aria-hidden="true" />
                    )}
                    <AlertTitle>{state.status === "error" ? "확인해 주세요" : "메일을 확인해 주세요"}</AlertTitle>
                    <AlertDescription>{state.message}</AlertDescription>
                  </Alert>
                ) : null}

                {isSignup ? (
                  <Field data-invalid={Boolean(state.fieldErrors?.displayName)}>
                    <FieldLabel htmlFor="displayName">닉네임</FieldLabel>
                    <Input
                      id="displayName"
                      name="displayName"
                      type="text"
                      autoComplete="name"
                      minLength={1}
                      maxLength={100}
                      required
                      aria-invalid={Boolean(state.fieldErrors?.displayName)}
                      aria-describedby={state.fieldErrors?.displayName ? "displayName-error" : undefined}
                      className="h-11"
                      placeholder="닉네임을 입력해 주세요"
                    />
                    <FieldError id="displayName-error">{state.fieldErrors?.displayName}</FieldError>
                  </Field>
                ) : null}

                <Field data-invalid={Boolean(state.fieldErrors?.email)}>
                  <FieldLabel htmlFor="email">이메일</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    aria-invalid={Boolean(state.fieldErrors?.email)}
                    aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
                    className="h-11"
                    placeholder="name@example.com"
                  />
                  <FieldError id="email-error">{state.fieldErrors?.email}</FieldError>
                </Field>

                <Field data-invalid={Boolean(state.fieldErrors?.password)}>
                  <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                  {isSignup ? <FieldDescription>6자 이상 입력해 주세요.</FieldDescription> : null}
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    minLength={isSignup ? 6 : undefined}
                    required
                    aria-invalid={Boolean(state.fieldErrors?.password)}
                    aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
                    className="h-11"
                    placeholder={isSignup ? "비밀번호를 입력해 주세요" : "비밀번호"}
                  />
                  <FieldError id="password-error">{state.fieldErrors?.password}</FieldError>
                </Field>

                {isSignup ? (
                  <Field data-invalid={Boolean(state.fieldErrors?.passwordConfirm)}>
                    <FieldLabel htmlFor="passwordConfirm">비밀번호 확인</FieldLabel>
                    <Input
                      id="passwordConfirm"
                      name="passwordConfirm"
                      type="password"
                      autoComplete="new-password"
                      minLength={6}
                      required
                      aria-invalid={Boolean(state.fieldErrors?.passwordConfirm)}
                      aria-describedby={state.fieldErrors?.passwordConfirm ? "passwordConfirm-error" : undefined}
                      className="h-11"
                      placeholder="비밀번호를 다시 입력해 주세요"
                    />
                    <FieldError id="passwordConfirm-error">{state.fieldErrors?.passwordConfirm}</FieldError>
                  </Field>
                ) : null}

                <Button className="mt-1 h-11 w-full" loading={submit.isPending} size="lg" type="submit">
                  {copy.submitLabel}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>

          <CardFooter className="justify-center py-3">
            <TextButton nativeButton={false} render={<Link href={copy.linkHref} />} tone="muted">
              {copy.linkLabel}
            </TextButton>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

export function LoginPage() {
  return <AuthPage mode="login" />;
}

export function SignupPage() {
  return <AuthPage mode="signup" />;
}
