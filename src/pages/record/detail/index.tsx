import { notFound } from "next/navigation";

import { isUuid } from "@/shared/lib/validation/is-uuid";

import { RecordDetailContent } from "./ui/record-detail-content";

type RecordDetailPageProps = {
  params: Promise<{ recordId: string }>;
};

export async function RecordDetailPage({ params }: RecordDetailPageProps) {
  const { recordId } = await params;

  if (!isUuid(recordId)) {
    notFound();
  }

  return <RecordDetailContent recordId={recordId} />;
}
