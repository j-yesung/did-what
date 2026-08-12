import { MapIcon, MapPinnedIcon, NotebookPenIcon, PlusIcon, SettingsIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getRecordLocations } from "@/entities/record";
import { createClient } from "@/shared/api/supabase/server";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";

import { KoreaActivityMap } from "./korea-activity-map";

const NAV_ICON = "size-5 [stroke-width:2]";

export async function HomePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { locations: records, error } = await getRecordLocations(userData.user.id);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-3 bg-background px-5 pt-3 pb-[calc(92px+env(safe-area-inset-bottom))] min-[700px]:shadow-[0_0_80px_color-mix(in_srgb,var(--brand-950),transparent_92%)]">
      <section className="grid min-h-0 flex-1 place-items-center px-1.5 py-1" aria-label="대한민국 활동 지도">
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

      <nav
        className="fixed right-[max(0px,calc((100vw-430px)/2))] bottom-0 left-[max(0px,calc((100vw-430px)/2))] z-10 grid min-h-[calc(76px+env(safe-area-inset-bottom))] grid-cols-4 border-border border-t bg-[color-mix(in_srgb,var(--surface),transparent_4%)] px-3 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur-[18px] [&_a:focus-visible]:outline [&_a:focus-visible]:outline-[3px] [&_a:focus-visible]:outline-ring [&_a:focus-visible]:-outline-offset-2 [&_a]:flex [&_a]:min-h-[54px] [&_a]:flex-col [&_a]:items-center [&_a]:justify-center [&_a]:gap-1 [&_a]:rounded-lg [&_a]:font-[650] [&_a]:text-[11px] [&_a]:text-muted-foreground"
        aria-label="주요 메뉴"
      >
        <Link className="text-primary!" href="/" aria-current="page">
          <MapIcon className={NAV_ICON} aria-hidden="true" />
          지도
        </Link>
        <Link href="/records">
          <NotebookPenIcon className={NAV_ICON} aria-hidden="true" />
          기록
        </Link>
        <Link href="/people">
          <UsersIcon className={NAV_ICON} aria-hidden="true" />
          사람
        </Link>
        <Link href="/settings">
          <SettingsIcon className={NAV_ICON} aria-hidden="true" />
          설정
        </Link>
      </nav>
    </main>
  );
}
