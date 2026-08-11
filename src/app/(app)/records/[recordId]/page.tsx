import { RecordDetailPage } from "@/_pages/record-detail";

type PageProps = {
  params: Promise<{ recordId: string }>;
};

export default function Page({ params }: PageProps) {
  return <RecordDetailPage params={params} />;
}
