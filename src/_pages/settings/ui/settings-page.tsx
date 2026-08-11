import { ChevronLeftIcon, ShieldCheckIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/features/auth";
import { createClient } from "@/shared/api/supabase/server";

export async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", data.user.id).maybeSingle();
  const displayName = profile?.display_name || "기록자";

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-5 bg-background px-5 py-6">
      <header className="grid grid-cols-[40px_1fr_40px] items-center">
        <Button
          size="icon-lg"
          variant="ghost"
          render={<Link href="/" aria-label="홈으로 돌아가기" />}
          nativeButton={false}
        >
          <ChevronLeftIcon aria-hidden="true" />
        </Button>
        <h1 className="text-center font-bold font-heading text-xl tracking-[-0.03em]">설정</h1>
      </header>

      <Card>
        <CardHeader className="items-center text-center">
          <Avatar size="lg" className="mb-2 size-16">
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              <UserRoundIcon className="size-6" aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-lg">{displayName}</CardTitle>
          <CardDescription>{data.user.email}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-3 rounded-xl bg-accent p-4 text-accent-foreground">
            <ShieldCheckIcon className="mt-0.5 size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium text-sm">로그인 상태 유지 중</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                브라우저나 설치된 앱을 다시 열어도 세션이 유효하면 자동으로 로그인됩니다.
              </p>
            </div>
          </div>
          <LogoutButton />
        </CardContent>
      </Card>
    </main>
  );
}
