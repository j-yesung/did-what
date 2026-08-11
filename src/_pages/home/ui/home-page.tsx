import { MapIcon, MapPinnedIcon, NotebookPenIcon, PlusIcon, SettingsIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { createClient } from "@/shared/api/supabase/server";

import styles from "./home-page.module.css";
import { KoreaActivityMap } from "./korea-activity-map";

export async function HomePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("records")
    .select("id, place:places(latitude, longitude)")
    .eq("owner_id", userData.user.id);
  const records = (data ?? []).map(({ id, place }) => ({ id, ...place }));

  return (
    <main className={styles.shell}>
      <section className={styles.mapArea} aria-label="대한민국 활동 지도">
        <KoreaActivityMap records={error ? [] : records} />
      </section>

      {error ? (
        <Alert variant="destructive">
          <MapPinnedIcon aria-hidden="true" />
          <AlertTitle>발자취를 불러오지 못했어요</AlertTitle>
          <AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription>
        </Alert>
      ) : records.length > 0 ? (
        <p className="text-center text-muted-foreground text-sm">지금까지 남긴 발자취 {records.length}개</p>
      ) : (
        <Empty className="flex-none py-4">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MapPinnedIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>아직 지도에 남긴 발자취가 없어요</EmptyTitle>
            <EmptyDescription>함께한 오늘의 장소를 첫 기록으로 남겨보세요.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/records/new" />} nativeButton={false}>
              <PlusIcon data-icon="inline-start" />첫 기록 남기기
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {error || records.length > 0 ? (
        <Button className="h-14 w-full shrink-0" size="lg" render={<Link href="/records/new" />} nativeButton={false}>
          <PlusIcon data-icon="inline-start" />새 기록 남기기
        </Button>
      ) : null}

      <nav className={styles.navigation} aria-label="주요 메뉴">
        <Link className={styles.activeNavItem} href="/" aria-current="page">
          <MapIcon className={styles.navIcon} aria-hidden="true" />
          지도
        </Link>
        <Link href="/records">
          <NotebookPenIcon className={styles.navIcon} aria-hidden="true" />
          기록
        </Link>
        <Link href="/people">
          <UsersIcon className={styles.navIcon} aria-hidden="true" />
          사람
        </Link>
        <Link href="/settings">
          <SettingsIcon className={styles.navIcon} aria-hidden="true" />
          설정
        </Link>
      </nav>
    </main>
  );
}
