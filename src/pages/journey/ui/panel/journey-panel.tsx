import { type Ref, useEffect, useState } from "react";

import { WarningCircleIcon } from "@phosphor-icons/react";

import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { pickedJourneyPlaces } from "../../model/queue";
import type { JourneyPlace, JourneySession } from "../../model/types";
import styles from "../journey-map.module.css";
import { RouteMetrics } from "./route-metrics";

type Edges = { start: boolean; end: boolean };

const scrollEdges = (row: HTMLElement): Edges => ({
  start: row.scrollLeft > 1,
  end: row.scrollLeft + row.clientWidth < row.scrollWidth - 1,
});

const keepIfSame = (next: Edges) => (current: Edges) =>
  current.start === next.start && current.end === next.end ? current : next;

type JourneyPanelProps = {
  ref: Ref<HTMLDivElement>;
  session: JourneySession;
  weather?: string;
  onRecover: (skip: boolean) => void;
  onSelectPlace: (place: JourneyPlace) => void;
  onPressPlace: (place: JourneyPlace) => void;
};

export function JourneyPanel({ ref, session, weather, onRecover, onSelectPlace, onPressPlace }: JourneyPanelProps) {
  const [chipRow, setChipRow] = useState<HTMLDivElement | null>(null);
  const [chipFade, setChipFade] = useState<Edges>({ start: false, end: false });

  useEffect(() => {
    if (!chipRow) return;

    const update = () => setChipFade(keepIfSame(scrollEdges(chipRow)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(chipRow);
    return () => observer.disconnect();
  }, [chipRow]);

  const selectedPlaceIds = new Set(pickedJourneyPlaces(session).map((place) => place.id));
  const failedPlaceId = session.status === "error" ? session.active?.id : undefined;

  return (
    <div ref={ref} className={styles.details}>
      {session.status === "error" && (
        <div role="alert" className={styles.error}>
          <div>
            <strong>
              {session.active ? `${session.active.name}까지 길을 잇지 못했어요` : "집에서 출발하는 길을 잇지 못했어요"}
            </strong>
            <p>{session.error}</p>
          </div>
          <Button
            className={styles.hit}
            color="dark"
            onClick={() => onRecover(Boolean(session.active))}
            size="medium"
            variant="weak"
          >
            {session.active ? "건너뛰기" : "다시 시도"}
          </Button>
        </div>
      )}
      <div className={cn(styles.placesHeading, !session.record.places.length && styles.placesEmpty)}>
        <p>
          {session.record.places.length ? (
            <>
              방문 장소 <span>{session.record.places.length}</span>
            </>
          ) : (
            "등록된 장소 없음"
          )}
        </p>
        {session.replaying && <span role="status">재생 중</span>}
      </div>
      {session.record.places.length > 0 && (
        <div
          key={session.record.id}
          ref={setChipRow}
          className={styles.chips}
          data-fade-end={chipFade.end ? "" : undefined}
          data-fade-start={chipFade.start ? "" : undefined}
          onScroll={(event) => setChipFade(keepIfSame(scrollEdges(event.currentTarget)))}
        >
          {session.record.places.map((place) => (
            <button
              key={place.id}
              className={cn(PRESS_FEEDBACK, FOCUS_RING)}
              type="button"
              onClick={() => onSelectPlace(place)}
              onPointerDown={(event) => {
                if (event.button === 0) onPressPlace(place);
              }}
              data-selected={selectedPlaceIds.has(place.id) ? "" : undefined}
              data-error={failedPlaceId === place.id ? "" : undefined}
            >
              {failedPlaceId === place.id && <WarningCircleIcon aria-hidden="true" size={16} />}
              {place.name}
              {selectedPlaceIds.has(place.id) && <span className="sr-only"> (선택됨)</span>}
            </button>
          ))}
        </div>
      )}
      <RouteMetrics segments={session.segments} weather={weather} instant={session.restored} />
      {session.segments.some((segment) => segment.route.straight) && (
        <p className={styles.note}>차로 갈 수 없는 구간은 직선으로 이었고 거리·시간에서 뺐어요</p>
      )}
      {session.status === "loading" && (
        <p className={styles.status} role="status">
          경로를 불러오고 있어요
        </p>
      )}
    </div>
  );
}
