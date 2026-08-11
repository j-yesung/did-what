import { ChevronLeftIcon, CircleAlertIcon, MapPinIcon, NotebookPenIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { createClient } from "@/shared/api/supabase/server";

import { RecordNewForm } from "./record-new-form";
import styles from "./record-new-page.module.css";

export async function RecordNewPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const [peopleResult, placesResult] = await Promise.all([
    supabase.from("people").select("id, name").eq("owner_id", userData.user.id).order("name"),
    supabase.from("places").select("id, name, address").eq("owner_id", userData.user.id).order("name"),
  ]);
  const people = peopleResult.data ?? [];
  const places = placesResult.data ?? [];
  const hasLoadError = Boolean(peopleResult.error || placesResult.error);

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Button
          aria-label="홈으로 돌아가기"
          nativeButton={false}
          render={<Link href="/" />}
          size="icon-lg"
          variant="ghost"
        >
          <ChevronLeftIcon />
        </Button>
        <div>
          <p className={styles.eyebrow}>NEW RECORD</p>
          <h1>새 기록</h1>
        </div>
      </header>

      <section className={styles.intro} aria-labelledby="record-intro-title">
        <h2 id="record-intro-title">오늘의 장면을 남겨보세요.</h2>
        <p>날짜, 사람, 장소와 한 일을 한 화면에서 빠르게 기록할 수 있어요.</p>
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
        <RecordNewForm people={people} places={places} />
      )}
    </main>
  );
}
