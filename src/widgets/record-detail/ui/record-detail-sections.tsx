import type { ComponentProps } from "react";

import { PlaceIconTile } from "@/entities/place";
import { PlaceSaveButton } from "@/features/place/save-place";
import { cn } from "@/shared/lib/utils";
import { CountBadge } from "@/shared/ui/count-badge";

const SECTION_TITLE = "relative w-fit font-extrabold text-[17px] tracking-[-0.03em]";
const QUOTE = "h-4.5 select-none font-extrabold text-[40px] text-input leading-[0.6]";

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
        <section aria-labelledby="sheet-record-places-title">
          <h3 className={SECTION_TITLE} id="sheet-record-places-title">
            방문 장소
            <CountBadge count={places.length} unit="곳" />
          </h3>
          <ol className="mt-5 flex flex-col">
            {places.map(({ place }) => (
              <li
                className="relative flex items-center gap-3.5 pb-6 not-last:after:absolute not-last:after:top-12 not-last:after:bottom-1 not-last:after:left-[21.5px] not-last:after:w-px not-last:after:bg-input last:pb-0"
                key={place.id}
              >
                <PlaceIconTile place={place} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[17px] tracking-[-0.02em]">{place.name}</p>
                  {place.address ? (
                    <p className="mt-0.5 truncate text-muted-foreground text-xs">{place.address}</p>
                  ) : null}
                </div>
                <PlaceSaveButton placeId={place.id} placeName={place.name} saved={Boolean(place.saved_at)} />
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {memo ? (
        <section aria-labelledby="sheet-record-memo-title">
          <h3 className={SECTION_TITLE} id="sheet-record-memo-title">
            우리 뭐했지
          </h3>
          <div className="mt-5">
            <p aria-hidden="true" className={QUOTE}>
              “
            </p>
            <div className="mt-2.5 flex flex-col gap-1.5 text-[15px] leading-[1.7] tracking-[-0.01em]">
              {memo.split("\n").map((line, index) => (
                <p className="min-h-lh whitespace-pre-wrap" key={`sheet-record-${index}`}>
                  {line}
                </p>
              ))}
            </div>
            <p aria-hidden="true" className={cn(QUOTE, "mt-1 text-right")}>
              <span className="inline-block rotate-180">“</span>
            </p>
          </div>
        </section>
      ) : null}
    </>
  );
}
