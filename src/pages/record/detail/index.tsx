import { notFound, redirect } from "next/navigation";

import { isUuid } from "@/shared/lib/validation/is-uuid";

type RecordDetailPageProps = {
  params: Promise<{ recordId: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
};

export async function RecordDetailPage({ params, searchParams }: RecordDetailPageProps) {
  const [{ recordId }, { from }] = await Promise.all([params, searchParams]);
  if (!isUuid(recordId)) notFound();
  const search = new URLSearchParams({ recordDetail: recordId });
  if (from === "notification") search.set("recordFrom", "notification");
  redirect(`/records?${search}`);
}
