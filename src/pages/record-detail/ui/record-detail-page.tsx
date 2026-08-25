import { BookOpenIcon, CalendarDotsIcon, MapPinIcon, NotePencilIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getRecord, getRecordWeatherLabel, normalizeRecordWeather, WeatherIcon } from "@/entities/record";
import { PlaceSaveButton } from "@/features/manage-place";
import { DeleteRecordButton } from "@/features/manage-record";
import { OverscrollBack } from "@/features/overscroll-back";
import { requireUser } from "@/shared/api/supabase/require-user";
import { formatRecordPeriod } from "@/shared/lib/date/format-date";
import { isUuid } from "@/shared/lib/validation/is-uuid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { TextButton } from "@/shared/ui/text-button";

type RecordDetailPageProps = {
  params: Promise<{ recordId: string }>;
};

export async function RecordDetailPage({ params }: RecordDetailPageProps) {
  const { recordId } = await params;

  if (!isUuid(recordId)) {
    notFound();
  }

  const { user } = await requireUser();

  const { data: record, error } = await getRecord(recordId, user.id);

  if (!record && !error) {
    notFound();
  }

  const weather = normalizeRecordWeather(record?.weather);

  return (
    <OverscrollBack fallbackHref="/records">
      <PageShell>
        <PageHeader
          action={
            record ? (
              <TextButton nativeButton={false} render={<Link href={`/records/${record.id}/edit`} />}>
                수정
              </TextButton>
            ) : undefined
          }
          back="/records"
          title="기록 상세"
        />

        {error ? (
          <LoadErrorAlert
            icon={<NotePencilIcon strokeWidth={2} aria-hidden="true" />}
            title="기록을 불러오지 못했어요"
          />
        ) : record ? (
          <>
            <section aria-labelledby="record-activity-title" className="px-1 py-4">
              <h2
                className="mt-2 text-balance font-bold text-3xl leading-tight tracking-[-0.045em]"
                id="record-activity-title"
              >
                {record.activity}
              </h2>
              <p className="mt-3 text-muted-foreground text-sm">함께한 날의 기억을 다시 꺼내보세요.</p>
            </section>

            <Card>
              <CardHeader>
                <CardTitle>이날의 기록</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="grid grid-cols-[20px_1fr] gap-3">
                  <CalendarDotsIcon strokeWidth={2} className="size-5 text-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-muted-foreground text-xs">날짜</p>
                    <p className="mt-1 font-medium">{formatRecordPeriod(record.recorded_at, record.recorded_until)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-[20px_1fr] gap-3">
                  <WeatherIcon weather={weather} className="size-5 text-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-muted-foreground text-xs">날씨</p>
                    <p className="mt-1 font-medium">{getRecordWeatherLabel(weather)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-[20px_1fr] gap-3">
                  <MapPinIcon strokeWidth={2} className="size-5 text-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-muted-foreground text-xs">지역</p>
                    <p className="mt-1 font-medium">
                      {record.region_label} / {record.region_name}
                    </p>
                  </div>
                </div>
                {record.record_places.length ? (
                  <div className="grid grid-cols-[20px_1fr] gap-3">
                    <MapPinIcon strokeWidth={2} className="size-5 text-foreground" aria-hidden="true" />
                    <div>
                      <p className="text-muted-foreground text-xs">방문 장소</p>
                      <ul className="mt-2 flex flex-col gap-2">
                        {record.record_places.map(({ place }) => (
                          <li key={place.id}>
                            <p className="font-medium">{place.name}</p>
                            {place.address ? (
                              <p className="mt-0.5 text-muted-foreground text-sm">{place.address}</p>
                            ) : null}
                            {!place.saved_at ? (
                              <div className="mt-2">
                                <PlaceSaveButton placeId={place.id} />
                              </div>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {record.memo ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpenIcon strokeWidth={2} className="size-5 text-foreground" aria-hidden="true" />
                    남겨둔 메모
                  </CardTitle>
                  <CardDescription>그날 기억하고 싶었던 이야기</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{record.memo}</p>
                </CardContent>
              </Card>
            ) : null}

            <footer className="flex justify-center py-2">
              <DeleteRecordButton activity={record.activity} recordId={record.id} />
            </footer>
          </>
        ) : null}
      </PageShell>
    </OverscrollBack>
  );
}
