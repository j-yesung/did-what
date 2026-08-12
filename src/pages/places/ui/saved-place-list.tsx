import { ChevronRightIcon, CircleAlertIcon, MapPinIcon } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { buttonVariants } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";

const DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Seoul",
  year: "numeric",
});

type SavedPlace = {
  id: string;
  name: string;
  address: string | null;
  saved_at: string | null;
};

type SavedPlaceListProps = {
  hasError: boolean;
  places: SavedPlace[];
};

export function SavedPlaceList({ hasError, places }: SavedPlaceListProps) {
  if (hasError) {
    return (
      <Alert variant="destructive">
        <CircleAlertIcon aria-hidden="true" />
        <AlertTitle>저장한 장소를 불러오지 못했어요</AlertTitle>
        <AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription>
      </Alert>
    );
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
            <CardDescription>내가 간직하기로 한 장소</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{place.address ?? "주소 정보 없음"}</p>
          </CardContent>
          <CardFooter className="justify-between gap-3">
            <p className="text-muted-foreground text-xs">
              {place.saved_at ? `${DATE_FORMATTER.format(new Date(place.saved_at))} 저장` : "저장한 장소"}
            </p>
            <Link className={buttonVariants({ size: "sm", variant: "ghost" })} href={`/places/${place.id}`}>
              이곳의 기록 보기
              <ChevronRightIcon aria-hidden="true" data-icon="inline-end" />
            </Link>
          </CardFooter>
        </Card>
      ))}
    </section>
  );
}
