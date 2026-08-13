import { CalendarDaysIcon, ChevronRightIcon, MapPinIcon, NotebookPenIcon, PlusIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getPerson, getPersonRecords } from "@/entities/person";
import { DeletePersonDialog, RenamePersonDialog } from "@/features/manage-person";
import { createClient } from "@/shared/api/supabase/server";
import { isUuid } from "@/shared/lib/is-uuid";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

const DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "long",
  timeZone: "Asia/Seoul",
});

type PersonDetailPageProps = {
  params: Promise<{ personId: string }>;
};

export async function PersonDetailPage({ params }: PersonDetailPageProps) {
  const { personId } = await params;

  if (!isUuid(personId)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const [personResult, recordsResult] = await Promise.all([
    getPerson(personId, userData.user.id),
    getPersonRecords(personId, userData.user.id),
  ]);

  if (!personResult.data && !personResult.error) {
    notFound();
  }

  const person = personResult.data;
  const records = recordsResult.data ?? [];
  const hasLoadError = Boolean(personResult.error || recordsResult.error);

  return (
    <PageShell>
      <PageHeader back="/people" eyebrow="PERSON DETAIL" title="함께한 사람" />

      {hasLoadError || !person ? (
        <Alert variant="destructive">
          <UserRoundIcon aria-hidden="true" />
          <AlertTitle>사람의 기록을 불러오지 못했어요</AlertTitle>
          <AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription>
        </Alert>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5 font-bold text-primary text-xs">
                <UserRoundIcon className="size-4" aria-hidden="true" />
                함께한 사람
              </CardDescription>
              <CardTitle className="text-xl">{person.name}</CardTitle>
              <CardDescription>{DATE_FORMATTER.format(new Date(person.created_at))}에 추가했어요.</CardDescription>
            </CardHeader>
            <CardFooter className="gap-2">
              <RenamePersonDialog name={person.name} personId={person.id} />
              <DeletePersonDialog name={person.name} personId={person.id} recordCount={records.length} />
            </CardFooter>
          </Card>

          {records.length ? (
            <section
              className="relative flex flex-col gap-4 before:absolute before:top-9 before:bottom-4 before:left-[7px] before:w-px before:bg-border"
              aria-labelledby="person-records-title"
            >
              <div className="flex items-center justify-between gap-3 px-1">
                <h2 className="flex items-center gap-2 font-bold font-heading" id="person-records-title">
                  <NotebookPenIcon className="size-5 text-primary" aria-hidden="true" />
                  함께한 기록
                </h2>
                <p className="text-muted-foreground text-xs">{records.length}개</p>
              </div>

              {records.map((record) => (
                <article className="relative pl-5" key={record.id}>
                  <span
                    className="absolute top-5 left-0 size-[15px] rounded-full border-4 border-background bg-primary"
                    aria-hidden="true"
                  />
                  <Card>
                    <CardHeader>
                      <CardTitle>{record.activity}</CardTitle>
                      <CardDescription className="flex items-center gap-1.5">
                        <CalendarDaysIcon className="size-4" aria-hidden="true" />
                        {DATE_FORMATTER.format(new Date(`${record.recorded_at}T00:00:00+09:00`))}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <p className="flex items-center gap-2 text-sm">
                        <MapPinIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                        {record.region_label} / {record.region_name}
                      </p>
                      {record.memo ? (
                        <p className="text-muted-foreground text-sm leading-relaxed">{record.memo}</p>
                      ) : null}
                    </CardContent>
                    <CardFooter className="justify-end">
                      <Button
                        nativeButton={false}
                        render={<Link href={`/records/${record.id}`} />}
                        size="sm"
                        variant="ghost"
                      >
                        기록 보기
                        <ChevronRightIcon data-icon="inline-end" />
                      </Button>
                    </CardFooter>
                  </Card>
                </article>
              ))}
            </section>
          ) : (
            <Empty className="border bg-card py-14">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <NotebookPenIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>{person.name}님과 함께한 기록이 없어요</EmptyTitle>
                <EmptyDescription>함께한 오늘의 장면을 첫 기록으로 남겨보세요.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button render={<Link href="/records/new" />} nativeButton={false}>
                  <PlusIcon data-icon="inline-start" />첫 기록 남기기
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </>
      )}
    </PageShell>
  );
}
