import type { RecordSearchParams } from "@/entities/record";
import { getRecordView } from "@/features/record/switch-record-view/server";

import { getRecordViewFromParams } from "../model/record-view";
import { RecordsContent } from "./records-content";

type RecordsPageProps = {
  searchParams: Promise<RecordSearchParams>;
};

export async function RecordsPage({ searchParams }: RecordsPageProps) {
  const view = getRecordViewFromParams(await searchParams) ?? (await getRecordView()) ?? "list";
  return <RecordsContent view={view} />;
}
