import { CalendarDaysIcon, ChevronRightIcon, MapPinIcon, NotebookPenIcon, PlusIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getRecords } from "@/entities/record";
import { createClient } from "@/shared/api/supabase/server";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";

const DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "long",
  timeZone: "Asia/Seoul",
});

export async function RecordsPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: records, error } = await getRecords(userData.user.id);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-5 bg-background px-5 pt-6 pb-[var(--nav-clearance)] [background:radial-gradient(circle_at_12%_0%,color-mix(in_srgb,var(--brand-100),transparent_32%),transparent_27%),var(--background)]">
      <header className="grid min-h-11 grid-cols-[40px_1fr_40px] items-center">
        <div className="col-start-2 text-center">
          <p className="font-bold text-[9px] text-primary tracking-[0.16em]">MEMORY LOG</p>
          <h1 className="font-bold font-heading text-xl tracking-[-0.03em]">기록</h1>
        </div>
      </header>

      {error ? (
        <Alert variant="destructive">
          <NotebookPenIcon aria-hidden="true" />
          <AlertTitle>기록을 불러오지 못했어요</AlertTitle>
          <AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription>
        </Alert>
      ) : records?.length ? (
        <section
          className="relative flex flex-col gap-4 before:absolute before:top-9 before:bottom-4 before:left-[7px] before:w-px before:bg-border"
          aria-label={`기록 ${records.length}개`}
        >
          <p className="px-1 text-muted-foreground text-xs">최근 기록 {records.length}개</p>
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
                    {record.place.name}
                  </p>
                  {record.memo ? <p className="text-muted-foreground text-sm leading-relaxed">{record.memo}</p> : null}
                </CardContent>
                <CardFooter className="justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <UsersIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <p className="truncate text-muted-foreground text-xs">
                      {record.record_people.map(({ person }) => person.name).join(", ")}
                    </p>
                  </div>
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
            <EmptyTitle>아직 남긴 기록이 없어요</EmptyTitle>
            <EmptyDescription>함께한 오늘의 장면을 첫 기록으로 남겨보세요.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/records/new" />} nativeButton={false}>
              <PlusIcon data-icon="inline-start" />첫 기록 남기기
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </main>
  );
}
