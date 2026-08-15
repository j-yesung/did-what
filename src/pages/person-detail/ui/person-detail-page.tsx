import { NotePencilIcon, UserCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";

import { getPerson, getPersonRecords } from "@/entities/person";
import { EmptyRecords, RecordCard, RecordTimeline } from "@/entities/record";
import { DeletePersonDialog, RenamePersonDialog } from "@/features/manage-person";
import { requireUser } from "@/shared/api/supabase/require-user";
import { formatDate } from "@/shared/lib/date/format-date";
import { isUuid } from "@/shared/lib/validation/is-uuid";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";

type PersonDetailPageProps = {
  params: Promise<{ personId: string }>;
};

export async function PersonDetailPage({ params }: PersonDetailPageProps) {
  const { personId } = await params;

  if (!isUuid(personId)) {
    notFound();
  }

  const { user } = await requireUser();
  const [personResult, recordsResult] = await Promise.all([
    getPerson(personId, user.id),
    getPersonRecords(personId, user.id),
  ]);

  if (!personResult.data && !personResult.error) {
    notFound();
  }

  const person = personResult.data;
  const records = recordsResult.data ?? [];
  const hasLoadError = Boolean(personResult.error || recordsResult.error);

  return (
    <PageShell>
      <PageHeader back="/people" title="함께한 사람" />

      {hasLoadError || !person ? (
        <LoadErrorAlert
          icon={<UserCircleIcon strokeWidth={2} aria-hidden="true" />}
          title="사람의 기록을 불러오지 못했어요"
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5 font-bold text-foreground text-xs">
                <UserCircleIcon strokeWidth={2} className="size-4" aria-hidden="true" />
                함께한 사람
              </CardDescription>
              <CardTitle className="text-xl">{person.name}</CardTitle>
              <CardDescription>{formatDate(person.created_at)}에 추가했어요.</CardDescription>
            </CardHeader>
            <CardFooter className="gap-2">
              <RenamePersonDialog name={person.name} personId={person.id} />
              <DeletePersonDialog name={person.name} personId={person.id} recordCount={records.length} />
            </CardFooter>
          </Card>

          {records.length ? (
            <RecordTimeline aria-labelledby="person-records-title">
              <div className="flex items-center justify-between gap-3 px-1">
                <h2 className="flex items-center gap-2 font-bold" id="person-records-title">
                  <NotePencilIcon strokeWidth={2} className="size-5 text-foreground" aria-hidden="true" />
                  함께한 기록
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
                  region={{ label: record.region_label, name: record.region_name }}
                />
              ))}
            </RecordTimeline>
          ) : (
            <EmptyRecords title={`${person.name}님과 함께한 기록이 없어요`} />
          )}
        </>
      )}
    </PageShell>
  );
}
