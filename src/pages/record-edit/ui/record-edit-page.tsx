import { notFound } from "next/navigation";

import { getRecord, normalizeRecordWeather } from "@/entities/record";
import { RecordForm, updateRecord } from "@/features/manage-record";
import { OverscrollBack } from "@/features/overscroll-back";
import { requireUser } from "@/shared/api/supabase/require-user";
import { isUuid } from "@/shared/lib/validation/is-uuid";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";

type RecordEditPageProps = {
  params: Promise<{ recordId: string }>;
};

export async function RecordEditPage({ params }: RecordEditPageProps) {
  const { recordId } = await params;

  if (!isUuid(recordId)) {
    notFound();
  }

  const { user } = await requireUser();

  const recordResult = await getRecord(recordId, user.id);

  if (!recordResult.data && !recordResult.error) {
    notFound();
  }

  const record = recordResult.data;
  const hasLoadError = Boolean(recordResult.error);

  return (
    <OverscrollBack fallbackHref={`/records/${recordId}`}>
      <PageShell className="block">
        <PageHeader back={`/records/${recordId}`} title="기록 수정" />

        <section className="px-1 pt-5.5 pb-5" aria-labelledby="record-edit-title">
          <h2
            className="font-[780] text-[clamp(24px,7vw,30px)] leading-[1.25] tracking-[-0.045em]"
            id="record-edit-title"
          >
            그날의 기록을 다듬어보세요.
          </h2>
          <p className="mt-2 text-[14px] text-muted-foreground leading-[1.6]">
            바뀐 날짜, 지역과 방문 장소를 한 번에 수정할 수 있어요.
          </p>
        </section>

        {hasLoadError || !record ? (
          <LoadErrorAlert title="수정할 기록을 불러오지 못했어요" />
        ) : (
          <RecordForm
            action={updateRecord.bind(null, recordId)}
            defaultRecordedAt={record.recorded_at}
            initialValues={{
              activity: record.activity,
              memo: record.memo ?? "",
              places: record.record_places.map(({ place }) => ({
                address: place.address,
                key: `existing:${place.id}`,
                name: place.name,
                reference: { kind: "existing" as const, placeId: place.id, save: false },
                saved: Boolean(place.saved_at),
              })),
              recordedAt: record.recorded_at,
              recordedUntil: record.recorded_until,
              weather: normalizeRecordWeather(record.weather),
              region: {
                code: record.region_code,
                fullName: record.region_name,
                label: record.region_label,
                latitude: record.region_latitude,
                longitude: record.region_longitude,
                name: record.region_name.split(" ").pop() ?? record.region_name,
              },
            }}
            mode="edit"
            returnTo={`/records/${recordId}`}
            savedTo={`/records/${recordId}`}
          />
        )}
      </PageShell>
    </OverscrollBack>
  );
}
