import { notFound } from "next/navigation";

import { getPeople } from "@/entities/person";
import { getPlaces } from "@/entities/place";
import { getRecord } from "@/entities/record";
import { RecordForm, updateRecord } from "@/features/manage-record";
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

  const [recordResult, peopleResult, placesResult] = await Promise.all([
    getRecord(recordId, user.id),
    getPeople(user.id),
    getPlaces(user.id),
  ]);

  if (!recordResult.data && !recordResult.error) {
    notFound();
  }

  const record = recordResult.data;
  const hasLoadError = Boolean(recordResult.error || peopleResult.error);

  return (
    <PageShell className="block">
      <PageHeader back={`/records/${recordId}`} backGuardFormId="record-form" eyebrow="EDIT MEMORY" title="기록 수정" />

      <section className="px-1 pt-[22px] pb-5" aria-labelledby="record-edit-title">
        <h2
          className="font-[780] text-[clamp(24px,7vw,30px)] leading-[1.25] tracking-[-0.045em]"
          id="record-edit-title"
        >
          그날의 기록을 다듬어보세요.
        </h2>
        <p className="mt-2 text-[14px] text-muted-foreground leading-[1.6]">
          바뀐 날짜, 사람, 지역과 방문 장소를 한 번에 수정할 수 있어요.
        </p>
      </section>

      {hasLoadError || !record ? (
        <LoadErrorAlert title="수정할 기록을 불러오지 못했어요" />
      ) : (
        <RecordForm
          action={updateRecord.bind(null, recordId)}
          initialValues={{
            activity: record.activity,
            memo: record.memo ?? "",
            personIds: record.record_people.map(({ person_id }) => person_id),
            places: record.record_places.map(({ place }) => ({
              address: place.address,
              key: `existing:${place.id}`,
              name: place.name,
              reference: { kind: "existing" as const, placeId: place.id, save: false },
              saved: Boolean(place.saved_at),
            })),
            recordedAt: record.recorded_at,
            region: {
              code: record.region_code,
              fullName: record.region_name,
              label: record.region_label,
              latitude: record.region_latitude,
              longitude: record.region_longitude,
              name: record.region_name.split(" ").at(-1) ?? record.region_name,
              type: record.region_name.endsWith("읍") ? "eup" : record.region_name.endsWith("면") ? "myeon" : "dong",
            },
          }}
          mode="edit"
          people={peopleResult.data ?? []}
          savedPlaces={placesResult.data ?? []}
        />
      )}
    </PageShell>
  );
}
