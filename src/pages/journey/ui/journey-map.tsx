"use client";

import { type CSSProperties, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from "react";

import { ListBulletsIcon, PathIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { recordLocationsQueryOptions } from "@/entities/record";
import { closeRecordSheetIntoCard } from "@/entities/record/model/record-sheet-morph";
import { HomeAddressSheet } from "@/features/home-address/ui/home-address-sheet";
import { getPageNavigation } from "@/shared/lib/navigation/page-navigation";
import { BackButton } from "@/shared/ui/back-button";
import { Button } from "@/shared/ui/button";
import { FixedToolbar } from "@/shared/ui/layouts";
import { LiquidGlassMenu } from "@/shared/ui/liquid-glass/menu/liquid-glass-menu";
import { RecordDetailBottomSheet } from "@/widgets/record-detail";
import { useCurrentMapLocation } from "@/widgets/region-activity-map/model/use-current-map-location";
import { MapControls } from "@/widgets/region-activity-map/ui/map-controls";

import { journeyRouteQuery } from "../api/route-query";
import { arrivalLights, dotStep, toSpot } from "../model/dot-map";
import { readJourneyUrlState, toJourneySearch } from "../model/journey-url-state";
import { expandView, national, pinAt, project } from "../model/map-view";
import { pickedJourneyPlaces } from "../model/queue";
import { type JourneyRecord, toJourneyRecord, withUnvisitedRegions } from "../model/record";
import type { JourneyPlace, JourneyRegion, JourneyVisit } from "../model/types";
import { useJourneySession } from "../model/use-journey-session";
import { MAP_OVERSCAN, useMapCamera } from "../model/use-map-camera";
import { JourneyActions } from "./header/journey-actions";
import { RecordHeader } from "./header/record-header";
import styles from "./journey-map.module.css";
import { DotLand } from "./map/dot-land";
import { Fireworks } from "./map/fireworks";
import { RouteLayer } from "./map/route-layer";
import { EmptyJourney } from "./panel/journey-notices";
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
  const routeAfterClose = useRef<string | null>(null);
  const restored = useRef(false);

  const browsableRegions = useMemo(() => withUnvisitedRegions(regions), [regions]);
  const [initialUrl] = useState(() => readJourneyUrlState(searchParams));
  const [region, setRegion] = useState<JourneyRegion | null>(
    () => browsableRegions.find(({ code }) => code === initialUrl.region) ?? null,
  );
  const restoringRecord = Boolean(region && initialUrl.record);
  const initialDetail = region ? initialUrl.detail : null;
  const [restoring, setRestoring] = useState(restoringRecord);
  const [detailRecordId, setDetailRecordId] = useState(initialDetail);
  const [detailOpen, setDetailOpen] = useState(Boolean(initialDetail));
  const [subregion, setSubregion] = useState(initialUrl.subregion);
  const [addressOpen, setAddressOpen] = useState(false);
  const [homeSaved, setHomeSaved] = useState(false);
  const homeReady = (hasHome || homeSaved) && !homeUnavailable;
  const currentLocation = useCurrentMapLocation();

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
        subregion,
        record: session?.record.id ?? null,
        places: session ? pickedJourneyPlaces(session).map(({ id }) => id) : [],
        detail: detailOpen ? detailRecordId : null,
      },
    );
    const url = `${window.location.pathname}${search}`;
    if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", url);
  }, [session, detailOpen, detailRecordId, region, subregion, restoring]);

  const restoreJourney = useEffectEvent((rows: NonNullable<typeof locations.data>) => {
    setRestoring(false);
    if (sessionRef.current || !initialUrl.record) return;

    const row = rows.find((item) => item.id === initialUrl.record);
    const record = region && row ? toJourneyRecord(row, region.code) : null;
    if (!region || !record) {
      setDetailOpen(false);
      return;
    }

    const places = initialUrl.places.flatMap((id) => record.places.filter((place) => place.id === id));
    void (homeReady ? journey.restore(record, region, places) : journey.preview(record, region, places));
  });

  useEffect(() => {
    if (restored.current || locations.isFetching || !locations.isSuccess) return;

    restored.current = true;
    restoreJourney(locations.data);
  }, [locations.data, locations.isFetching, locations.isSuccess]);

  const resumeRoute = useEffectEvent(() => {
    const current = sessionRef.current;
    if (current?.status === "home") journey.begin(current.record, current.region, current.queue);
  });

  useEffect(() => {
    if (homeReady) resumeRoute();
  }, [homeReady]);

  const revealLocation = useEffectEvent((point: { x: number; y: number }) => {
    const current = viewRef.current;
    const visible =
      point.x >= current.x &&
      point.x <= current.x + current.width &&
      point.y >= current.y &&
      point.y <= current.y + current.height;
    if (!visible) moveCamera({ ...current, x: point.x - current.width / 2, y: point.y - current.height / 2 });
  });

  const { position } = currentLocation;

  useEffect(() => {
    if (position) revealLocation(project(position.longitude, position.latitude));
  }, [position]);

  const journeyRecord = (recordId: string) => {
    const record = locations.data?.find((item) => item.id === recordId);
    return record && region ? toJourneyRecord(record, region.code) : null;
  };

  const reset = () => {
    restored.current = true;
    setRestoring(false);
    journey.clear();
    setRegion(null);
    moveCamera(national);
  };

  const leaveRegionFromTab = useEffectEvent(() => {
    if (region && !new URLSearchParams(window.location.search).has("region")) reset();
  });

  useEffect(() => {
    if (searchParams) leaveRegionFromTab();
  }, [searchParams]);

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

  const openDetail = (recordId: string) => {
    setDetailRecordId(recordId);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    if (!session && detailRecordId) closeRecordSheetIntoCard(detailRecordId, () => setDetailOpen(false));
    else setDetailOpen(false);
  };

  const startRecord = (recordId: string) => {
    const record = journeyRecord(recordId);
    if (!record || !region) return;
    if (homeReady) journey.begin(record, region);
    else void journey.preview(record, region);
    requestAnimationFrame(() => title.current?.focus());
  };

  const prefetchRoute = (recordId: string) => {
    const record = journeyRecord(recordId);
    if (record && region && homeReady) void queryClient.prefetchQuery(routeQuery(record, region, null, null));
  };

  const focusRegions = () =>
    requestAnimationFrame(() => main.current?.querySelector<HTMLButtonElement>('[aria-label="지역 목록"]')?.focus());
  const waiting = restoring && !locations.isError;
  const browsingRegion = Boolean(region && !session && !waiting);
  const mode = waiting ? "restoring" : session ? "journey" : region ? "region" : "map";

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
  const locationPoint = position && project(position.longitude, position.latitude);
  const routableDetail = detailRecordId && !session ? journeyRecord(detailRecordId) : null;

  return (
    <main
      ref={main}
      data-mode={mode}
      data-empty={regions.length === 0 ? "" : undefined}
      className={styles.page}
      data-direction="forward"
      data-funnel-step
    >
      {session ? (
        <RecordHeader
          ref={headerRef}
          titleRef={title}
          regionName={session.region.name}
          record={activeRecord}
          onRead={() => openDetail(session.record.id)}
        />
      ) : !region ? (
        <h1 className="sr-only">기록 지도</h1>
      ) : null}
      <div
        ref={stageRef}
        className={styles.stage}
        inert={browsingRegion || waiting}
        aria-hidden={browsingRegion || waiting}
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
            {locationPoint && (
              <g className={`${styles.pinned} ${styles.place}`} style={pinAt(locationPoint)}>
                <circle cx={locationPoint.x} cy={locationPoint.y} r={unit * 4.5} className={styles.arrival} />
                <circle
                  cx={locationPoint.x}
                  cy={locationPoint.y}
                  r={unit * 9}
                  strokeWidth={unit}
                  className={styles.pulse}
                />
              </g>
            )}
          </svg>
        </div>
      </div>
      <FixedToolbar className="gap-2">
        <div
          className={`${styles.backSlot} ${styles.solidGlass}`}
          data-visible={browsingRegion ? "" : undefined}
          inert={!browsingRegion}
        >
          <BackButton
            aria-label="전국 지도로"
            onClick={() => {
              reset();
              focusRegions();
            }}
          />
        </div>
        {!restoring && (
          <LiquidGlassMenu
            label="지역"
            triggerLabel="지역 목록"
            icon={ListBulletsIcon}
            align="start"
            actions={browsableRegions.map((item) => ({
              label: item.name,
              description: item.count ? `기록 ${item.count}개` : undefined,
              className: item.count ? undefined : "text-muted-foreground",
              selected: item.code === region?.code,
              onSelect: () => openRegion(item),
            }))}
          />
        )}
        {session && (
          <JourneyActions
            replaying={session.replaying}
            routed={session.status !== "home"}
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
        )}
      </FixedToolbar>
      {mode === "map" && <MapControls currentLocation={currentLocation} />}
      {mode === "map" && !regions.length && <EmptyJourney />}
      {session && (
        <JourneyPanel
          ref={panelRef}
          session={session}
          weather={activeRecord?.weather}
          homeUnavailable={homeUnavailable}
          onRegisterHome={() => setAddressOpen(true)}
          onRecover={journey.recover}
          onSelectPlace={(place) => {
            if (session.status !== "home") journey.selectPlace(place);
            else if (!homeUnavailable) setAddressOpen(true);
          }}
          onPressPlace={journey.pressPlace}
        />
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
          onRecordOpen={openDetail}
        />
      )}
      <HomeAddressSheet
        address={null}
        memberName={member.name}
        onOpenChange={setAddressOpen}
        onSaved={() => {
          queryClient.removeQueries({ queryKey: ["journey-route", member.id] });
          setHomeSaved(true);
        }}
        open={addressOpen}
      />
      <RecordDetailBottomSheet
        action={
          routableDetail && (
            <Button
              className="rounded-full"
              fullWidth
              onClick={() => {
                routeAfterClose.current = routableDetail.id;
                closeDetail();
              }}
              onPointerDown={(event) => {
                if (event.button === 0) prefetchRoute(routableDetail.id);
              }}
              size="xlarge"
            >
              <PathIcon aria-hidden="true" className="size-5" data-icon="inline-start" />
              경로 보기
            </Button>
          )
        }
        backLabel="지도로"
        screen={!session}
        showBackButton={!session}
        member={member}
        onDeleted={() => {
          setDetailOpen(false);
          deletedRegion.current = sessionRef.current?.region ?? region;
        }}
        onCloseComplete={() => {
          setDetailRecordId(null);
          const routedRecordId = routeAfterClose.current;
          routeAfterClose.current = null;
          if (routedRecordId) {
            startRecord(routedRecordId);
            return;
          }

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
        onOpenChange={(nextOpen) => {
          if (nextOpen) setDetailOpen(true);
          else closeDetail();
        }}
        open={detailOpen}
        record={detailRecordId ? { id: detailRecordId } : null}
      />
    </main>
  );
}
