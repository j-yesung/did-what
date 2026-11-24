import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";

import { fetchPlaces, placesQueryOptions } from "@/entities/place";
import { getRecord } from "@/entities/record/server";
import { updateRecord } from "@/features/record/edit-record/api/update-record";
import { requireUser } from "@/shared/api/supabase/require-user";
import { createQueryClient } from "@/shared/lib/react-query/query-client";
import { isUuid } from "@/shared/lib/validation/is-uuid";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { toRecordEditValues } from "@/widgets/record-form/model/record-edit-values";
import { RecordForm } from "@/widgets/record-form/record-form";

type RecordEditPageProps = {
  params: Promise<{ recordId: string }>;
};

export async function RecordEditPage({ params }: RecordEditPageProps) {
  const { recordId } = await params;

  if (!isUuid(recordId)) {
    notFound();
  }

  const { supabase, user } = await requireUser();
  const queryClient = createQueryClient();

  // 저장한 장소는 '내 장소에서 추가'에만 쓴다. 폼이 그걸 기다리며 가려지지 않게 함께 받아 두고,
  // 실패하면 화면에서 다시 받는다(prefetchQuery는 실패를 던지지 않는다).
  const [recordResult] = await Promise.all([
    getRecord(recordId, user.id),
    queryClient.prefetchQuery({ ...placesQueryOptions, queryFn: () => fetchPlaces(supabase) }),
  ]);

  if (!recordResult.data && !recordResult.error) {
    notFound();
  }

  const record = recordResult.data;

  if (recordResult.error || !record) {
    return (
      <PageShell className="block">
        <h1 className="sr-only">기록 수정</h1>
        <PageHeader back={`/records/${recordId}`} />
        <LoadErrorAlert title="수정할 기록을 불러오지 못했어요" />
      </PageShell>
    );
  }

  return (
    <PageShell className="h-(--screen-height) min-h-0 gap-0 overflow-hidden px-0 pt-0 pb-0">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <RecordForm
          action={updateRecord.bind(null, recordId)}
          initialValues={toRecordEditValues(record)}
          mode="edit"
          returnTo={`/records/${recordId}`}
          savedTo={`/records/${recordId}`}
        />
      </HydrationBoundary>
    </PageShell>
  );
}
