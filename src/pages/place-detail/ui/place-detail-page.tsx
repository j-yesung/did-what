import { CalendarDaysIcon, ChevronRightIcon, MapPinIcon, MapPinnedIcon, NotebookPenIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getPlace, getPlaceRecords } from "@/entities/place";
import { DeletePlaceDialog, PlaceSaveButton } from "@/features/manage-place";
import { createClient } from "@/shared/api/supabase/server";
import { isUuid } from "@/shared/lib/is-uuid";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { buttonVariants } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { PageHeader, PageShell } from "@/shared/ui/layouts";

const DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "long",
  timeZone: "Asia/Seoul",
});

type PlaceDetailPageProps = {
  params: Promise<{ placeId: string }>;
};

export async function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { placeId } = await params;

  if (!isUuid(placeId)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const [placeResult, recordsResult] = await Promise.all([
    getPlace(placeId, userData.user.id),
    getPlaceRecords(placeId, userData.user.id),
  ]);

  if (!placeResult.data && !placeResult.error) {
    notFound();
  }

  const place = placeResult.data;
  const records = (recordsResult.data ?? [])
    .map(({ record }) => record)
    .toSorted((a, b) => b.recorded_at.localeCompare(a.recorded_at));
  const hasLoadError = Boolean(placeResult.error || recordsResult.error);

  return (
    <PageShell className="[background:radial-gradient(circle_at_88%_0%,color-mix(in_srgb,var(--brand-100),transparent_30%),transparent_28%),var(--background)]">
      <PageHeader back="/places" eyebrow="PLACE DETAIL" title="기억의 장소" />

      {hasLoadError || !place ? (
        <Alert variant="destructive">
          <MapPinIcon aria-hidden="true" />
          <AlertTitle>장소의 기록을 불러오지 못했어요</AlertTitle>
          <AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription>
        </Alert>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5 font-bold text-primary text-xs">
                <MapPinnedIcon className="size-4" aria-hidden="true" />
                기억의 장소
              </CardDescription>
              <CardTitle className="text-xl">{place.name}</CardTitle>
              <CardDescription>{place.address ?? "주소 정보 없음"}</CardDescription>
            </CardHeader>
            <CardFooter>
              <div className="flex w-full flex-col gap-3">
                <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <CalendarDaysIcon className="size-4" aria-hidden="true" />
                  {place.saved_at
                    ? `${DATE_FORMATTER.format(new Date(place.saved_at))}에 저장했어요.`
                    : "방문 기록에 연결된 장소예요."}
                </p>
                <PlaceSaveButton placeId={place.id} saved={Boolean(place.saved_at)} />
                <DeletePlaceDialog name={place.name} placeId={place.id} recordCount={records.length} />
              </div>
            </CardFooter>
          </Card>

          {records.length ? (
            <section
              className="relative flex flex-col gap-4 before:absolute before:top-9 before:bottom-4 before:left-[7px] before:w-px before:bg-border"
              aria-labelledby="place-records-title"
            >
              <div className="flex items-center justify-between gap-3 px-1">
                <h2 className="flex items-center gap-2 font-bold font-heading" id="place-records-title">
                  <NotebookPenIcon className="size-5 text-primary" aria-hidden="true" />
                  이곳의 기록
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
                    {record.memo ? (
                      <CardContent>
                        <p className="text-muted-foreground text-sm leading-relaxed">{record.memo}</p>
                      </CardContent>
                    ) : null}
                    <CardFooter className="justify-end">
                      <Link className={buttonVariants({ size: "sm", variant: "ghost" })} href={`/records/${record.id}`}>
                        기록 보기
                        <ChevronRightIcon aria-hidden="true" data-icon="inline-end" />
                      </Link>
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
                <EmptyTitle>{place.name}에서 남긴 기록이 없어요</EmptyTitle>
                <EmptyDescription>이곳에서 함께한 장면을 첫 기록으로 남겨보세요.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link className={buttonVariants()} href="/records/new">
                  <PlusIcon aria-hidden="true" data-icon="inline-start" />첫 기록 남기기
                </Link>
              </EmptyContent>
            </Empty>
          )}
        </>
      )}
    </PageShell>
  );
}
