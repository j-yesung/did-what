import { MapPinIcon } from "lucide-react";
import Link from "next/link";

import { DeletePlaceDialog } from "@/features/manage-place";
import { formatShortDate } from "@/shared/lib/date/format-date";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { TextButton } from "@/shared/ui/text-button";

type SavedPlace = {
  id: string;
  name: string;
  address: string | null;
  record_places: { count: number }[];
  saved_at: string | null;
};

type SavedPlaceListProps = {
  hasError: boolean;
  places: SavedPlace[];
};

export function SavedPlaceList({ hasError, places }: SavedPlaceListProps) {
  if (hasError) {
    return <LoadErrorAlert title="저장한 장소를 불러오지 못했어요" />;
  }

  if (places.length === 0) {
    return (
      <Empty className="border bg-card py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPinIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>아직 저장한 장소가 없어요</EmptyTitle>
          <EmptyDescription>위 검색란에서 첫 번째 추억의 장소를 찾아 저장해 보세요.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <section aria-label={`저장한 장소 ${places.length}곳`} className="flex flex-col gap-3">
      <div className="px-1">
        <h2 className="mt-1 font-bold text-lg">저장한 장소</h2>
      </div>
      {places.map((place) => (
        <Card key={place.id} size="sm">
          <CardHeader>
            <CardTitle>{place.name}</CardTitle>
            <CardDescription>
              {place.saved_at ? `${formatShortDate(place.saved_at)} 저장` : "저장한 장소"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{place.address ?? "주소 정보 없음"}</p>
          </CardContent>
          <CardFooter className="justify-between gap-3 py-2">
            <DeletePlaceDialog
              iconOnly
              name={place.name}
              placeId={place.id}
              recordCount={place.record_places[0]?.count ?? 0}
            />
            <TextButton
              nativeButton={false}
              render={<Link href={`/places/${place.id}`} />}
              size="sm"
              tone="muted"
              variant="arrow"
            >
              기록 보기
            </TextButton>
          </CardFooter>
        </Card>
      ))}
    </section>
  );
}
