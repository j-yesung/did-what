import type { ComponentProps } from "react";

import { PlaceIconTile } from "@/entities/place";
import { PlaceSaveButton } from "@/features/place/save-place";

type RecordDetailSectionsProps = {
  heading?: "h2" | "h3";
  idPrefix: string;
  memo: string | null;
  places?: {
    place: ComponentProps<typeof PlaceIconTile>["place"] & {
      id: string;
      name: string;
      address: string | null;
      saved_at: string | null;
    };
  }[];
  placeCount?: number;
};

export function RecordDetailSections({
  heading: Heading = "h2",
  idPrefix,
  memo,
  places,
  placeCount = places?.length ?? 0,
}: RecordDetailSectionsProps) {
  return (
    <>
      {placeCount > 0 ? (
        <section aria-labelledby={`${idPrefix}-places-title`} className="px-1 pt-1">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Heading className="font-semibold text-base" id={`${idPrefix}-places-title`}>
              우리 어디 갔지?
            </Heading>
            <p className="text-muted-foreground text-xs">함께한 장소 {placeCount}곳</p>
          </div>
          <ul aria-busy={!places || undefined} className="flex flex-col">
            {places
              ? places.map(({ place }) => (
                  <li className="flex min-h-11 items-center gap-3 border-b py-3" key={place.id}>
                    <PlaceIconTile place={place} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{place.name}</p>
                      {place.address ? (
                        <p className="mt-0.5 truncate text-muted-foreground text-xs">{place.address}</p>
                      ) : null}
                    </div>
                    <PlaceSaveButton placeId={place.id} placeName={place.name} saved={Boolean(place.saved_at)} />
                  </li>
                ))
              : Array.from({ length: placeCount }, (_, index) => (
                  <li
                    aria-hidden="true"
                    className="h-11 animate-pulse rounded-lg bg-muted"
                    key={`${idPrefix}-place-${index}`}
                  />
                ))}
          </ul>
        </section>
      ) : null}
      {memo ? (
        <section aria-labelledby={`${idPrefix}-memo-title`} className="px-1 pt-1">
          <Heading className="mb-3 font-semibold text-base" id={`${idPrefix}-memo-title`}>
            우리 뭐했지?
          </Heading>
          <div className="flex flex-col gap-2 border-primary border-l-2 pl-4 text-sm leading-relaxed">
            {memo.split("\n").map((line, index) => (
              <p className="min-h-lh whitespace-pre-wrap" key={`${idPrefix}-${index}`}>
                {line}
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
