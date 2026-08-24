import { CalendarDotsIcon, MapPinAreaIcon, MapPinIcon, NotePencilIcon } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";

import { getPlace, getPlaceRecords } from "@/entities/place";
import { EmptyRecords, RecordCard, RecordTimeline } from "@/entities/record";
import { requireUser } from "@/shared/api/supabase/require-user";
import { formatDate } from "@/shared/lib/date/format-date";
import { isUuid } from "@/shared/lib/validation/is-uuid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";

type PlaceDetailPageProps = {
  params: Promise<{ placeId: string }>;
};

export async function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { placeId } = await params;

  if (!isUuid(placeId)) {
    notFound();
  }

  const { user } = await requireUser();
  const [placeResult, recordsResult] = await Promise.all([
    getPlace(placeId, user.id),
    getPlaceRecords(placeId, user.id),
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
    <PageShell>
      <PageHeader back="/places" title="기억의 장소" />

      {hasLoadError || !place ? (
        <LoadErrorAlert
          icon={<MapPinIcon strokeWidth={2} aria-hidden="true" />}
          title="장소의 기록을 불러오지 못했어요"
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5 font-bold text-foreground text-xs">
                <MapPinAreaIcon strokeWidth={2} className="size-4" aria-hidden="true" />
                기억의 장소
              </CardDescription>
              <CardTitle className="text-xl">{place.name}</CardTitle>
              <CardDescription>{place.address ?? "주소 정보 없음"}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <CalendarDotsIcon strokeWidth={2} className="size-4" aria-hidden="true" />
                {place.saved_at ? `${formatDate(place.saved_at)}에 저장했어요.` : "방문 기록에 연결된 장소예요."}
              </p>
            </CardContent>
          </Card>

          {records.length ? (
            <RecordTimeline aria-labelledby="place-records-title">
              <div className="flex items-center justify-between gap-3 px-1">
                <h2 className="flex items-center gap-2 font-bold" id="place-records-title">
                  <NotePencilIcon strokeWidth={2} className="size-5 text-foreground" aria-hidden="true" />
                  이곳의 기록
                </h2>
                <p className="text-muted-foreground text-xs">{records.length}개</p>
              </div>

              {records.map((record) => (
                <RecordCard
                  activity={record.activity}
                  key={record.id}
                  memo={record.memo}
                  recordId={record.id}
                  recordedAt={record.recorded_at}
                  recordedUntil={record.recorded_until}
                  weather={record.weather}
                />
              ))}
            </RecordTimeline>
          ) : (
            <EmptyRecords title={`${place.name}에서 남긴 기록이 없어요`} />
          )}
        </>
      )}
    </PageShell>
  );
}
