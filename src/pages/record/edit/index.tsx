import { notFound } from "next/navigation";

import { getSavedPlaces } from "@/entities/place/server";
import { normalizeRecordCategory, normalizeRecordWeather, sortPrimaryRegionFirst } from "@/entities/record";
import { getRecord } from "@/entities/record/server";
import { updateRecord } from "@/features/record/edit-record/api/update-record";
import { toExistingRecordLocationPlace, toShortRegionName } from "@/features/record/select-record-location";
import { requireUser } from "@/shared/api/supabase/require-user";
import { isUuid } from "@/shared/lib/validation/is-uuid";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { OverscrollBack } from "@/shared/ui/overscroll-back";
import { RecordEditForm } from "@/widgets/record-form/record-edit-form";

type RecordEditPageProps = {
  params: Promise<{ recordId: string }>;
};

export async function RecordEditPage({ params }: RecordEditPageProps) {
  const { recordId } = await params;

  if (!isUuid(recordId)) {
    notFound();
  }

  const { user } = await requireUser();

  // 저장한 장소는 '내 장소에서 추가'에만 쓴다. 폼이 그걸 기다리며 가려지지 않게 함께 받아 넘기고,
  // 실패하면 화면에서 다시 받는다.
  const [recordResult, savedPlaces] = await Promise.all([
    getRecord(recordId, user.id),
    getSavedPlaces(user.id).catch(() => undefined),
  ]);

  if (!recordResult.data && !recordResult.error) {
    notFound();
  }

  const record = recordResult.data;
  const hasLoadError = Boolean(recordResult.error);

  return (
    <OverscrollBack fallbackHref={`/records/${recordId}`}>
      <PageShell className="block">
        <h1 className="sr-only">기록 수정</h1>
        <PageHeader back={`/records/${recordId}`} />

        <section className="px-1 pt-5.5 pb-5" aria-labelledby="record-edit-title">
          <h2
            className="font-[780] text-[clamp(24px,7vw,30px)] leading-tight tracking-[-0.045em]"
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
          <RecordEditForm
            action={updateRecord.bind(null, recordId)}
            initialValues={{
              activity: record.activity,
              category: normalizeRecordCategory(record.category),
              memo: record.memo ?? "",
              /**
               * 저장하면 첫 방문 지역이 대표 지역이 된다. 지금 대표 지역의 장소와 지역을 앞에 둬야
               * 지역을 건드리지 않고 저장했을 때 대표 지역이 바뀌지 않는다.
               */
              places: sortPrimaryRegionFirst(
                record.record_places,
                record.region_code,
                ({ place }) => place.region_code,
              ).map(({ place }) => toExistingRecordLocationPlace(place)),
              recordedAt: record.recorded_at,
              recordedUntil: record.recorded_until,
              weather: normalizeRecordWeather(record.weather),
              // 장소에서 따라온 지역은 장소가 다시 데려오므로, 직접 고른 지역만 되살린다.
              regions: sortPrimaryRegionFirst(record.record_regions, record.region_code, (region) => region.region_code)
                .filter(({ selected_directly: selectedDirectly }) => selectedDirectly)
                .map((region) => ({
                  code: region.region_code,
                  fullName: region.region_name,
                  label: region.region_label,
                  latitude: region.region_latitude,
                  longitude: region.region_longitude,
                  name: toShortRegionName(region.region_name),
                })),
            }}
            initialSavedPlaces={savedPlaces}
            returnTo={`/records/${recordId}`}
            savedTo={`/records/${recordId}`}
          />
        )}
      </PageShell>
    </OverscrollBack>
  );
}
