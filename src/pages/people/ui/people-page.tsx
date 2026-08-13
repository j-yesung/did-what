import { ChevronRightIcon, UserRoundIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getPeople } from "@/entities/person";
import { CreatePersonForm } from "@/features/manage-person";
import { createClient } from "@/shared/api/supabase/server";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

const DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Seoul",
  year: "numeric",
});

export async function PeoplePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: people, error } = await getPeople(userData.user.id);
  const personCount = people?.length ?? 0;

  return (
    <PageShell>
      <PageHeader title="사람" />

      <section className="px-1" aria-labelledby="people-intro-title">
        <p className="font-bold text-primary text-xs">{personCount}명과 함께 기록 중</p>
        <h2 id="people-intro-title" className="mt-2 font-bold font-heading text-2xl tracking-[-0.04em]">
          기억 속 사람들을 모아보세요.
        </h2>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
          추가한 사람은 새 기록을 남길 때 바로 선택할 수 있어요.
        </p>
      </section>

      <CreatePersonForm />

      {error ? (
        <Alert variant="destructive">
          <UsersIcon aria-hidden="true" />
          <AlertTitle>사람 목록을 불러오지 못했어요</AlertTitle>
          <AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription>
        </Alert>
      ) : people?.length ? (
        <section className="flex flex-col gap-3" aria-label={`함께한 사람 ${people.length}명`}>
          {people.map((person) => (
            <Card key={person.id} size="sm">
              <CardHeader>
                <CardTitle>{person.name}</CardTitle>
                <CardDescription>함께한 사람</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs">새 기록에서 이 사람을 선택할 수 있어요.</p>
              </CardContent>
              <CardFooter className="justify-between gap-3">
                <p className="text-muted-foreground text-xs">
                  {DATE_FORMATTER.format(new Date(person.created_at))} 추가
                </p>
                <Button nativeButton={false} render={<Link href={`/people/${person.id}`} />} size="sm" variant="ghost">
                  함께한 기록 보기
                  <ChevronRightIcon data-icon="inline-end" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>
      ) : (
        <Empty className="border bg-card py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRoundIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>아직 추가한 사람이 없어요</EmptyTitle>
            <EmptyDescription>위 입력란에 첫 번째 이름을 적어 함께한 사람을 추가해 보세요.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </PageShell>
  );
}
