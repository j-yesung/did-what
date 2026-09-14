import { notFound } from "next/navigation";

import { requireMember } from "@/entities/member/server";
import { isUuid } from "@/shared/lib/validation/is-uuid";

import { RecordDetailContent } from "./ui/record-detail-content";

type RecordDetailPageProps = {
  params: Promise<{ recordId: string }>;
};

export async function RecordDetailPage({ params }: RecordDetailPageProps) {
  const [{ recordId }, { member }] = await Promise.all([params, requireMember()]);

  if (!isUuid(recordId)) {
    notFound();
  }

  return <RecordDetailContent member={{ id: member.id, name: member.name }} recordId={recordId} />;
}
