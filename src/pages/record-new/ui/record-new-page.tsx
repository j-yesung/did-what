import { CircleAlertIcon, MapPinIcon, NotebookPenIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getPeople } from "@/entities/person";
import { getPlaces } from "@/entities/place";
import { createRecord, RecordForm } from "@/features/manage-record";
import { createClient } from "@/shared/api/supabase/server";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

export async function RecordNewPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const [peopleResult, placesResult] = await Promise.all([getPeople(userData.user.id), getPlaces(userData.user.id)]);
  const people = peopleResult.data ?? [];
  const places = placesResult.data ?? [];
  const hasLoadError = Boolean(peopleResult.error || placesResult.error);

  return (
    <PageShell className="block pb-[calc(var(--nav-clearance)+96px)] [background:radial-gradient(circle_at_88%_2%,color-mix(in_srgb,var(--brand-100),transparent_34%),transparent_28%),var(--background)] min-[700px]:shadow-[0_0_80px_color-mix(in_srgb,var(--brand-950),transparent_92%)]">
      <PageHeader back="/" eyebrow="NEW RECORD" title="새 기록" />

      <section
        className="px-1 pt-[22px] pb-5 motion-safe:animate-[enter_360ms_ease-out_both]"
        aria-labelledby="record-intro-title"
      >
        <h2
          className="font-[780] font-heading text-[clamp(24px,7vw,30px)] leading-[1.25] tracking-[-0.045em]"
          id="record-intro-title"
        >
          오늘의 장면을 남겨보세요.
        </h2>
        <p className="mt-2 text-[14px] text-muted-foreground leading-[1.6]">
          날짜, 사람, 장소와 한 일을 한 화면에서 빠르게 기록할 수 있어요.
        </p>
      </section>

      {hasLoadError ? (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>선택지를 불러오지 못했어요</AlertTitle>
          <AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription>
        </Alert>
      ) : people.length === 0 || places.length === 0 ? (
        <Empty className="border bg-card py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <NotebookPenIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>기록 전에 준비가 필요해요</EmptyTitle>
            <EmptyDescription>
              {people.length === 0 && places.length === 0
                ? "함께한 사람과 방문한 장소를 먼저 추가해 주세요."
                : people.length === 0
                  ? "기록에 연결할 사람을 먼저 추가해 주세요."
                  : "기록에 연결할 장소를 먼저 추가해 주세요."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {people.length === 0 ? (
              <Button className="w-full" render={<Link href="/people" />} nativeButton={false}>
                <UsersIcon data-icon="inline-start" />
                사람 추가하러 가기
              </Button>
            ) : null}
            {places.length === 0 ? (
              <Button className="w-full" variant="outline" render={<Link href="/places" />} nativeButton={false}>
                <MapPinIcon data-icon="inline-start" />
                장소 추가하러 가기
              </Button>
            ) : null}
          </EmptyContent>
        </Empty>
      ) : (
        <RecordForm action={createRecord} people={people} places={places} />
      )}
    </PageShell>
  );
}
