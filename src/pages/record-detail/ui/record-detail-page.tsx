import { BookOpenIcon, CalendarDaysIcon, ChevronLeftIcon, MapPinIcon, NotebookPenIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/shared/api/supabase/server";
import { isUuid } from "@/shared/lib/is-uuid";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

const DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "long",
  timeZone: "Asia/Seoul",
});

type RecordDetailPageProps = {
  params: Promise<{ recordId: string }>;
};

export async function RecordDetailPage({ params }: RecordDetailPageProps) {
  const { recordId } = await params;

  if (!isUuid(recordId)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: record, error } = await supabase
    .from("records")
    .select("id, activity, memo, recorded_at, place:places(name, address), record_people(person:people(name))")
    .eq("id", recordId)
    .eq("owner_id", userData.user.id)
    .maybeSingle();

  if (!record && !error) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-5 bg-background px-5 py-6 [background:radial-gradient(circle_at_88%_0%,color-mix(in_srgb,var(--brand-100),transparent_32%),transparent_28%),var(--background)]">
      <header className="grid grid-cols-[40px_1fr_40px] items-center">
        <Button
          aria-label="기록 목록으로 돌아가기"
          nativeButton={false}
          render={<Link href="/records" />}
          size="icon-lg"
          variant="ghost"
        >
          <ChevronLeftIcon aria-hidden="true" />
        </Button>
        <div className="text-center">
          <p className="font-bold text-[9px] text-primary tracking-[0.16em]">MEMORY DETAIL</p>
          <h1 className="font-bold font-heading text-xl tracking-[-0.03em]">기록 상세</h1>
        </div>
      </header>

      {error ? (
        <Alert variant="destructive">
          <NotebookPenIcon aria-hidden="true" />
          <AlertTitle>기록을 불러오지 못했어요</AlertTitle>
          <AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription>
        </Alert>
      ) : record ? (
        <>
          <section aria-labelledby="record-activity-title" className="px-1 py-4">
            <p className="font-bold text-primary text-xs">OUR MOMENT</p>
            <h2
              className="mt-2 text-balance font-bold font-heading text-3xl leading-tight tracking-[-0.045em]"
              id="record-activity-title"
            >
              {record.activity}
            </h2>
            <p className="mt-3 text-muted-foreground text-sm">함께한 날의 장면을 다시 꺼내봤어요.</p>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>이날의 기록</CardTitle>
              <CardDescription>언제, 누구와, 어디서 함께했는지</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid grid-cols-[20px_1fr] gap-3">
                <CalendarDaysIcon className="size-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-muted-foreground text-xs">날짜</p>
                  <p className="mt-1 font-medium">
                    {DATE_FORMATTER.format(new Date(`${record.recorded_at}T00:00:00+09:00`))}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-[20px_1fr] gap-3">
                <UsersIcon className="size-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-muted-foreground text-xs">함께한 사람</p>
                  <p className="mt-1 font-medium">
                    {record.record_people.map(({ person }) => person.name).join(", ") || "함께한 사람 정보 없음"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-[20px_1fr] gap-3">
                <MapPinIcon className="size-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-muted-foreground text-xs">장소</p>
                  <p className="mt-1 font-medium">{record.place.name}</p>
                  {record.place.address ? (
                    <p className="mt-1 text-muted-foreground text-sm">{record.place.address}</p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          {record.memo ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpenIcon className="size-5 text-primary" aria-hidden="true" />
                  남겨둔 메모
                </CardTitle>
                <CardDescription>그날 기억하고 싶었던 이야기</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{record.memo}</p>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
