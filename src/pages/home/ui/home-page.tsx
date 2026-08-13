import { MapPinnedIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

import { getRecordLocations } from "@/entities/record";
import { requireUser } from "@/shared/api/supabase/require-user";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";

import { KoreaActivityMap } from "./korea-activity-map";

export async function HomePage() {
  const { user } = await requireUser();

  const { locations: records, error } = await getRecordLocations(user.id);

  return (
    <PageShell className="gap-3 pt-3 min-[700px]:shadow-[0_0_80px_color-mix(in_srgb,var(--blue-950),transparent_92%)]">
      <section className="grid min-h-0 flex-1 place-items-center px-1.5 py-1" aria-label="대한민국 활동 지도">
        <KoreaActivityMap records={error ? [] : records} />
      </section>

      {error ? (
        <LoadErrorAlert icon={<MapPinnedIcon aria-hidden="true" />} title="발자취를 불러오지 못했어요" />
      ) : records.length > 0 ? (
        <p className="text-center text-muted-foreground text-sm">지금까지 남긴 발자취 {records.length}개</p>
      ) : (
        <Empty className="flex-none py-4">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MapPinnedIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>아직 지도에 남긴 발자취가 없어요</EmptyTitle>
            <EmptyDescription>함께한 오늘의 지역을 첫 발자취로 남겨보세요.</EmptyDescription>
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
    </PageShell>
  );
}
