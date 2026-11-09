import type { RecordSearchParams } from "@/entities/record";
import { getRecordView } from "@/features/record/switch-record-view/server";

import { getRecordViewFromParams } from "../model/record-view";
import { RecordsScreen } from "./records-screen";

type RecordsPageProps = {
  searchParams: Promise<RecordSearchParams>;
};

export async function RecordsPage({ searchParams }: RecordsPageProps) {
  const [params, savedView] = await Promise.all([searchParams, getRecordView()]);
  return <RecordsScreen paramsView={getRecordViewFromParams(params)} savedView={savedView} />;
}
