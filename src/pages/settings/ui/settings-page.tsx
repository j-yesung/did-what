import { UserRoundIcon } from "lucide-react";
import { redirect } from "next/navigation";

import { getProfileName } from "@/entities/profile";
import { LogoutButton } from "@/features/auth";
import { createClient } from "@/shared/api/supabase/server";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const displayName = (await getProfileName(data.user.id)) || "기록자";

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-5 bg-background px-5 pt-6 pb-[var(--nav-clearance)]">
      <header className="grid min-h-11 grid-cols-[40px_1fr_40px] items-center">
        <div className="col-start-2 text-center">
          <p className="font-bold text-[9px] text-primary tracking-[0.16em]">MY ACCOUNT</p>
          <h1 className="font-bold font-heading text-xl tracking-[-0.03em]">설정</h1>
        </div>
      </header>

      <Card>
        <CardHeader className="justify-items-center text-center">
          <Avatar size="lg" className="mb-2 size-16">
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              <UserRoundIcon className="size-6" aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-lg">{displayName}</CardTitle>
          <CardDescription>{data.user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>
    </main>
  );
}
