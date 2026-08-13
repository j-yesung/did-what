"use client";

import { useActionState } from "react";

import { CircleAlertIcon, LogInIcon, MailCheckIcon, MapPinnedIcon, UserRoundPlusIcon } from "lucide-react";
import Link from "next/link";

import { INITIAL_AUTH_STATE, login, signup } from "@/features/auth";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";

type AuthPageProps = {
  mode: "login" | "signup";
};

const COPY = {
  login: {
    description: "함께한 시간과 장소를 다시 이어 보세요.",
    linkHref: "/signup",
    linkLabel: "처음이신가요? 회원가입",
    submitLabel: "로그인",
    title: "다시 만나 반가워요",
  },
  signup: {
    description: "소중한 사람과의 발자취를 한곳에 모아 보세요.",
    linkHref: "/login",
    linkLabel: "이미 계정이 있나요? 로그인",
    submitLabel: "회원가입",
    title: "첫 기록을 준비해요",
  },
} as const;

function AuthPage({ mode }: AuthPageProps) {
  const isSignup = mode === "signup";
  const copy = COPY[mode];
  const [state, formAction, pending] = useActionState(isSignup ? signup : login, INITIAL_AUTH_STATE);
  const SubmitIcon = isSignup ? UserRoundPlusIcon : LogInIcon;

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-5 pt-[calc(40px+env(safe-area-inset-top))] pb-[calc(40px+env(safe-area-inset-bottom))]">
      <div
        className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 size-80 -translate-x-1/2 rounded-full bg-brand-100 blur-3xl"
        aria-hidden="true"
      />

      <section className="relative z-10 flex w-full max-w-[430px] flex-col gap-6" aria-labelledby="auth-title">
        <div className="flex items-center justify-center gap-2 font-heading font-semibold text-brand-800">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <MapPinnedIcon className="size-5" strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="text-lg tracking-[-0.02em]">뭐했지</span>
        </div>

        <Card className="shadow-[0_24px_80px_color-mix(in_srgb,var(--brand-950),transparent_88%)]">
          <CardHeader className="gap-2 pb-2 text-center">
            <CardTitle>
              <h1 id="auth-title" className="font-bold font-heading text-2xl tracking-[-0.03em]">
                {copy.title}
              </h1>
            </CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </CardHeader>

          <CardContent>
            <form action={formAction}>
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
                    <FieldLabel htmlFor="displayName">표시 이름</FieldLabel>
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
                      placeholder="예: 김뭐했지"
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
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    minLength={6}
                    required
                    aria-invalid={Boolean(state.fieldErrors?.password)}
                    aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
                    className="h-11"
                    placeholder="6자 이상 입력해 주세요"
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
                      placeholder="한 번 더 입력해 주세요"
                    />
                    <FieldError id="passwordConfirm-error">{state.fieldErrors?.passwordConfirm}</FieldError>
                  </Field>
                ) : null}

                <Button className="mt-1 h-11 w-full" size="lg" type="submit" disabled={pending}>
                  {pending ? (
                    <Spinner data-icon="inline-start" aria-label="처리 중" />
                  ) : (
                    <SubmitIcon data-icon="inline-start" />
                  )}
                  {pending ? "처리 중..." : copy.submitLabel}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>

          <CardFooter className="justify-center py-3">
            <Button variant="link" render={<Link href={copy.linkHref} />} nativeButton={false}>
              {copy.linkLabel}
            </Button>
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
