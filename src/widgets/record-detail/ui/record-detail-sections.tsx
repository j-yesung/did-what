import type { ComponentProps } from "react";

import { PlaceIconTile } from "@/entities/place";
import { PlaceSaveButton } from "@/features/place/save-place";

type RecordDetailSectionsProps = {
  memo: string | null;
  places: {
    place: ComponentProps<typeof PlaceIconTile>["place"] & {
      id: string;
      name: string;
      address: string | null;
      saved_at: string | null;
    };
  }[];
};

export function RecordDetailSections({ memo, places }: RecordDetailSectionsProps) {
  return (
    <>
      {places.length > 0 ? (
        <section aria-labelledby="sheet-record-places-title" className="px-1 pt-1">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-base" id="sheet-record-places-title">
              우리 어디 갔지?
            </h3>
            <p className="text-muted-foreground text-xs">함께한 장소 {places.length}곳</p>
          </div>
          <ul className="flex flex-col">
            {places.map(({ place }) => (
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
            ))}
          </ul>
        </section>
      ) : null}
      {memo ? (
        <section aria-labelledby="sheet-record-memo-title" className="px-1 pt-1">
          <h3 className="mb-3 font-semibold text-base" id="sheet-record-memo-title">
            우리 뭐했지?
          </h3>
          <div className="flex flex-col gap-2 border-primary border-l-2 pl-4 text-sm leading-relaxed">
            {memo.split("\n").map((line, index) => (
              <p className="min-h-lh whitespace-pre-wrap" key={`sheet-record-${index}`}>
                {line}
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
