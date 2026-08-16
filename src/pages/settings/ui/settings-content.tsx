"use client";

import { useQuery } from "@tanstack/react-query";

import { profileQueryOptions } from "@/entities/profile/api/profile-query";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { Spinner } from "@/shared/ui/spinner";

export function SettingsContent({ email }: { email?: string }) {
  const profile = useQuery(profileQueryOptions);

  if (profile.isError) {
    return <LoadErrorAlert title="프로필을 불러오지 못했어요" />;
  }

  return (
    <Card>
      <CardHeader className="justify-items-center text-center">
        {profile.isPending ? (
          <Spinner
            aria-label="프로필을 불러오는 중"
            className="motion-safe:fade-in my-3 size-6 text-muted-foreground motion-safe:animate-in motion-safe:fill-mode-both motion-safe:delay-300"
          />
        ) : (
          <>
            <CardTitle className="text-lg">{profile.data || "기록자"}</CardTitle>
            <CardDescription>{email}</CardDescription>
          </>
        )}
      </CardHeader>
    </Card>
  );
}
