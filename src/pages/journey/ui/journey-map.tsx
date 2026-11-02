"use client";

import { type CSSProperties, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from "react";

import { ListBulletsIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { recordLocationsQueryOptions } from "@/entities/record";
import { HomeAddressSheet } from "@/features/home-address/ui/home-address-sheet";
import { getPageNavigation } from "@/shared/lib/navigation/page-navigation";
import { FixedToolbar } from "@/shared/ui/layouts";
import { MorphMenu } from "@/shared/ui/morph-menu";
import { RecordDetailBottomSheet } from "@/widgets/record-detail";

import { journeyRouteQuery } from "../api/route-query";
import { arrivalLights, dotStep, toSpot } from "../model/dot-map";
import { readJourneyUrlState, toJourneySearch } from "../model/journey-url-state";
import { expandView, national, project } from "../model/map-view";
import { pickedJourneyPlaces } from "../model/queue";
import { type JourneyRecord, toJourneyRecord } from "../model/record";
import type { JourneyPlace, JourneyRegion, JourneyVisit } from "../model/types";
import { useJourneySession } from "../model/use-journey-session";
import { MAP_OVERSCAN, useMapCamera } from "../model/use-map-camera";
import { JourneyActions } from "./header/journey-actions";
import { RecordHeader } from "./header/record-header";
import styles from "./journey-map.module.css";
import { DotLand } from "./map/dot-land";
import { Fireworks } from "./map/fireworks";
import { RouteLayer } from "./map/route-layer";
import { EmptyJourney, HomeNotice } from "./panel/journey-notices";
import { JourneyPanel } from "./panel/journey-panel";
import { RegionExplorer } from "./panel/region-explorer";

const EMPTY_RECORDS: [] = [];

type JourneyMapProps = {
  regions: JourneyRegion[];
  visits: JourneyVisit[];
  hasHome: boolean;
  homeVersion: string | null;
  homeUnavailable: boolean;
  member: { id: string; name: string };
};

export function JourneyMap({ regions, visits, hasHome, homeVersion, homeUnavailable, member }: JourneyMapProps) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const locations = useQuery(recordLocationsQueryOptions);
  const main = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const deletedRegion = useRef<JourneyRegion | null>(null);
  const restored = useRef(false);

  const [initialUrl] = useState(() => readJourneyUrlState(searchParams));
  const restoringDetail = Boolean(initialUrl.region && initialUrl.record && initialUrl.detail);
  const [restoring, setRestoring] = useState(Boolean(initialUrl.region && initialUrl.record));
  const [detailRecordId, setDetailRecordId] = useState(restoringDetail ? initialUrl.record : null);
  const [detailOpen, setDetailOpen] = useState(restoringDetail);
  const [region, setRegion] = useState<JourneyRegion | null>(
    () => regions.find(({ code }) => code === initialUrl.region) ?? null,
  );
  const [pendingRecord, setPendingRecord] = useState<string | null>(null);
  const [subregion, setSubregion] = useState<string | null>(null);
  const [addressOpen, setAddressOpen] = useState(false);
  const [homeSaved, setHomeSaved] = useState(false);
  const homeReady = (hasHome || homeSaved) && !homeUnavailable;

  const routeQuery = (
    record: JourneyRecord,
    recordRegion: JourneyRegion,
    target: JourneyPlace | null,
    from: JourneyPlace | null,
  ) => journeyRouteQuery(member.id, homeVersion, record, recordRegion, target, from);

  const {
    view,
    viewRef,
    unit,
    stageRef,
    layerRef,
    headerRef,
    panelRef,
    handlers,
    setView,
    moveCamera,
    stop,
    fitRoutes,
    followRoute,
  } = useMapCamera();
  const journey = useJourneySession({
    routeQuery,
    camera: { viewRef, setView, moveCamera, stop, fitRoutes, followRoute },
  });
  const { session, sessionRef } = journey;

  useLayoutEffect(() => {
    if (main.current && getPageNavigation(window).traversal) main.current.style.animation = "none";
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) return;

    root.classList.add("dark");
    return () => root.classList.remove("dark");
  }, []);

  useEffect(
    () => () => {
      restored.current = false;
    },
    [],
  );

  useEffect(() => {
    if (restoring) return;
    const search = toJourneySearch(
      window.location.search,
      region && {
        region: region.code,
        record: session?.record.id ?? null,
        places: session?.segments.flatMap((segment) => (segment.target ? [segment.target.id] : [])) ?? [],
        detail: Boolean(session && detailOpen),
      },
    );
    const url = `${window.location.pathname}${search}`;
    if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", url);
  }, [session, detailOpen, region, restoring]);

  const restoreJourney = useEffectEvent((rows: NonNullable<typeof locations.data>) => {
    setRestoring(false);
    if (sessionRef.current || !initialUrl.record) return;

    const target = regions.find((item) => item.code === initialUrl.region);
    const row = rows.find((item) => item.id === initialUrl.record);
    const record = target && row && homeReady ? toJourneyRecord(row, target.code) : null;
    if (!target || !record) {
      setDetailOpen(false);
      return;
    }

    setRegion(target);
    void journey.restore(
      record,
      target,
      initialUrl.places.flatMap((id) => record.places.filter((place) => place.id === id)),
    );
  });

  useEffect(() => {
    if (restored.current || locations.isFetching || (!locations.data && !locations.isError)) return;

    restored.current = true;
    restoreJourney(locations.data ?? []);
  }, [locations.data, locations.isFetching, locations.isError]);

  const journeyRecord = (recordId: string) => {
    const record = locations.data?.find((item) => item.id === recordId);
    return record && region ? toJourneyRecord(record, region.code) : null;
  };

  const reset = () => {
    journey.clear();
    setRegion(null);
    moveCamera(national);
  };

  const openRegion = (selected: JourneyRegion) => {
    journey.clear();
    stop();
    if (selected.code !== region?.code) setSubregion(null);
    setRegion(selected);
  };

  const showRegionRecords = (target: JourneyRegion) => {
    journey.clear();
    stop();
    setRegion(target);
    focusRegions();
  };

  const startRecord = (recordId: string) => {
    const record = journeyRecord(recordId);
    if (!record || !region || homeUnavailable) return;
    if (!homeReady) {
      setPendingRecord(recordId);
      setAddressOpen(true);
      return;
    }
    journey.begin(record, region);
    requestAnimationFrame(() => title.current?.focus());
  };

  const prefetchRoute = (recordId: string) => {
    const record = journeyRecord(recordId);
    if (record && region && homeReady) void queryClient.prefetchQuery(routeQuery(record, region, null, null));
  };

  const focusRegions = () =>
    requestAnimationFrame(() => main.current?.querySelector<HTMLButtonElement>('[aria-label="지역 목록"]')?.focus());
  const browsingRegion = Boolean(region && !session && !restoring);
  const mode = restoring ? "restoring" : session ? "journey" : region ? "region" : "map";

  const activeRecord = locations.data?.find((record) => record.id === session?.record.id);
  const drawn = expandView(view, MAP_OVERSCAN);
  const recordId = session?.record.id ?? null;
  const reachedKey = JSON.stringify(journey.completeSegments.map((segment) => segment.target?.id ?? null));
  const spots = useMemo(() => visits.map(toSpot), [visits]);
  const lights = useMemo(
    () => arrivalLights(visits, recordId, JSON.parse(reachedKey) as (string | null)[], journey.arrivals),
    [visits, recordId, reachedKey, journey.arrivals],
  );
  const viewBox = `${drawn.x} ${drawn.y} ${drawn.width} ${drawn.height}`;

  return (
    <main
      ref={main}
      data-mode={mode}
      data-empty={regions.length === 0 ? "" : undefined}
      className={`${styles.page} dark`}
      data-direction="forward"
      data-funnel-step
    >
      {session ? (
        <RecordHeader
          ref={headerRef}
          titleRef={title}
          regionName={session.region.name}
          record={activeRecord}
          onRead={() => {
            setDetailRecordId(session.record.id);
            setDetailOpen(true);
          }}
        />
      ) : !region ? (
        <h1 className="sr-only">기록 지도</h1>
      ) : null}
      <div
        ref={stageRef}
        className={styles.stage}
        inert={browsingRegion || restoring}
        aria-hidden={browsingRegion || restoring}
        {...handlers}
      >
        <div ref={layerRef} className={styles.layer} style={{ "--map-overscan": MAP_OVERSCAN } as CSSProperties}>
          <svg className={styles.base} viewBox={viewBox} aria-hidden="true">
            <DotLand box={drawn} step={dotStep(unit)} spots={spots} arrivals={lights} />
          </svg>
          <svg className={styles.map} viewBox={viewBox} aria-label="방문 지역 지도">
            {session && (
              <RouteLayer
                segments={session.segments}
                complete={journey.completeSegments}
                drawing={session.status === "drawing"}
                highlight={journey.highlight}
                unit={unit}
                onSketchEnd={journey.handleSketchEnd}
              />
            )}
            {session &&
              journey.arrivals.map(({ key, target }) => {
                const end = target ?? session.record.destination;
                return <Fireworks key={key} point={project(end.longitude, end.latitude)} unit={unit} />;
              })}
          </svg>
        </div>
      </div>
      <FixedToolbar>
        {session ? (
          <JourneyActions
            replaying={session.replaying}
            onFitRoutes={() => moveCamera(fitRoutes(session.segments.map((segment) => segment.route)))}
            onReplay={() => {
              journey.begin(session.record, session.region, pickedJourneyPlaces(session), true);
              title.current?.focus();
            }}
            onShowRecords={() => showRegionRecords(session.region)}
            onReset={() => {
              reset();
              focusRegions();
            }}
          />
        ) : (
          !restoring &&
          regions.length > 0 && (
            <MorphMenu
              label="방문한 지역"
              triggerLabel="지역 목록"
              moreIcon={ListBulletsIcon}
              layout="column"
              align="start"
              menuWidth={216}
              actions={regions.map((item) => ({
                label: item.name,
                description: `기록 ${item.count}개`,
                selected: item.code === region?.code,
                onSelect: () => openRegion(item),
              }))}
            />
          )
        )}
      </FixedToolbar>
      {!session && !restoring && !regions.length && <EmptyJourney />}
      {session && (
        <JourneyPanel
          ref={panelRef}
          session={session}
          weather={activeRecord?.weather}
          onRecover={journey.recover}
          onSelectPlace={journey.selectPlace}
          onPressPlace={journey.pressPlace}
        />
      )}
      {!session && !region && regions.length > 0 && !homeReady && (
        <HomeNotice unavailable={homeUnavailable} onRegister={() => setAddressOpen(true)} />
      )}
      {region && (
        <RegionExplorer
          region={region}
          records={locations.data ?? EMPTY_RECORDS}
          active={browsingRegion}
          pending={locations.isPending}
          error={locations.isError}
          homeUnavailable={homeUnavailable}
          retrying={locations.isFetching}
          subregion={subregion}
          onRetry={() => void locations.refetch()}
          onSubregionChange={setSubregion}
          onReset={() => {
            reset();
            focusRegions();
          }}
          onRecordOpen={startRecord}
          onRecordPress={prefetchRoute}
        />
      )}
      <HomeAddressSheet
        address={null}
        className={styles.sheet}
        dark
        memberName={member.name}
        onOpenChange={(open) => {
          setAddressOpen(open);
          if (!open) setPendingRecord(null);
        }}
        onSaved={() => {
          setHomeSaved(true);
          if (pendingRecord) {
            const record = journeyRecord(pendingRecord);
            if (record && region) journey.begin(record, region);
            setPendingRecord(null);
          }
        }}
        open={addressOpen}
      />
      <RecordDetailBottomSheet
        backLabel="지도로"
        showBackButton={false}
        className={`${styles.sheet} dark`}
        member={member}
        onDeleted={() => {
          setDetailOpen(false);
          deletedRegion.current = sessionRef.current?.region ?? null;
        }}
        onCloseComplete={() => {
          setDetailRecordId(null);
          const previous = deletedRegion.current;
          if (!previous) return;

          deletedRegion.current = null;
          journey.clear();
          const remaining = (locations.data ?? []).filter(
            (record) => record.id !== detailRecordId && toJourneyRecord(record, previous.code),
          );
          if (remaining.length) showRegionRecords(previous);
          else reset();
        }}
        onOpenChange={setDetailOpen}
        open={detailOpen}
        record={detailRecordId ? { id: detailRecordId } : null}
      />
    </main>
  );
}
