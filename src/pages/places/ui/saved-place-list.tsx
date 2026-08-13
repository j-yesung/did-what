import { ChevronRightIcon, MapPinIcon } from "lucide-react";
import Link from "next/link";

import { DeletePlaceDialog, PlaceSaveButton } from "@/features/manage-place";
import { formatShortDate } from "@/shared/lib/format-date";
import { buttonVariants } from "@/shared/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";

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
        <h2 className="mt-1 font-bold font-heading text-lg">저장한 장소</h2>
      </div>
      {places.map((place) => (
        <Card key={place.id} size="sm">
          <CardHeader>
            <CardTitle>{place.name}</CardTitle>
            <CardDescription>
              {place.saved_at ? `${formatShortDate(place.saved_at)} 저장` : "저장한 장소"}
            </CardDescription>
            <CardAction className="-mt-1.5 -mr-1.5">
              <PlaceSaveButton iconOnly placeId={place.id} saved={Boolean(place.saved_at)} />
            </CardAction>
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
            <Link className={buttonVariants({ size: "sm", variant: "ghost" })} href={`/places/${place.id}`}>
              기록 보기
              <ChevronRightIcon aria-hidden="true" data-icon="inline-end" />
            </Link>
          </CardFooter>
        </Card>
      ))}
    </section>
  );
}
