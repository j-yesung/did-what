import { BookOpenIcon, CalendarDaysIcon, MapPinIcon, NotebookPenIcon, PencilIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getRecord } from "@/entities/record";
import { PlaceSaveButton } from "@/features/manage-place";
import { DeleteRecordDialog } from "@/features/manage-record";
import { requireUser } from "@/shared/api/supabase/require-user";
import { formatRecordDate } from "@/shared/lib/format-date";
import { isUuid } from "@/shared/lib/is-uuid";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";

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

  return (
    <PageShell>
      <PageHeader back="/records" eyebrow="MEMORY DETAIL" title="기록 상세" />

      {error ? (
        <LoadErrorAlert icon={<NotebookPenIcon aria-hidden="true" />} title="기록을 불러오지 못했어요" />
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
            <div className="mt-5 flex gap-2">
              <Button nativeButton={false} render={<Link href={`/records/${record.id}/edit`} />} variant="outline">
                <PencilIcon data-icon="inline-start" />
                수정
              </Button>
              <DeleteRecordDialog activity={record.activity} recordId={record.id} />
            </div>
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
                  <p className="mt-1 font-medium">{formatRecordDate(record.recorded_at)}</p>
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
                  <p className="text-muted-foreground text-xs">지역</p>
                  <p className="mt-1 font-medium">
                    {record.region_label} / {record.region_name}
                  </p>
                </div>
              </div>
              {record.record_places.length ? (
                <div className="grid grid-cols-[20px_1fr] gap-3">
                  <MapPinIcon className="size-5 text-primary" aria-hidden="true" />
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
                              <PlaceSaveButton placeId={place.id} saved={false} />
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
    </PageShell>
  );
}
