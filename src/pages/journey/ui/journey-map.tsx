"use client";

import { type CSSProperties, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { recordLocationsQueryOptions } from "@/entities/record";
import { HomeAddressSheet } from "@/features/home-address/ui/home-address-sheet";
import { getPageNavigation } from "@/shared/lib/navigation/page-navigation";
import { FixedToolbar } from "@/shared/ui/layouts";
import { PageBackButton } from "@/shared/ui/layouts/page-back-button";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { RecordDetailBottomSheet } from "@/widgets/record-detail";

import { journeyRouteQuery } from "../api/route-query";
import { readJourneyUrlState, toJourneySearch } from "../model/journey-url-state";
import { expandView, national, placesBox, project } from "../model/map-view";
import { prefersReducedMotion } from "../model/motion";
import { pickedJourneyPlaces } from "../model/queue";
import { type JourneyRecord, toJourneyRecord } from "../model/record";
import type { JourneyPlace, JourneyRegion } from "../model/types";
import { useJourneySession } from "../model/use-journey-session";
import { useJourneySheet } from "../model/use-journey-sheet";
import { MAP_OVERSCAN, useMapCamera } from "../model/use-map-camera";
import { JourneyActions } from "./header/journey-actions";
import { RecordHeader } from "./header/record-header";
import styles from "./journey-map.module.css";
import { DistrictShapes, MapShapes } from "./map/map-shapes";
import { PlaceLabels } from "./map/place-labels";
import { NODE_HIT_RADIUS, RegionNodes } from "./map/region-nodes";
import { RouteLayer } from "./map/route-layer";
import { EmptyJourney, HomeNotice } from "./panel/journey-notices";
import { JourneyPanel } from "./panel/journey-panel";
import { JourneySheet, RegionRecords } from "./sheet/journey-sheet";
import { RegionChoices } from "./sheet/region-choices";

type JourneyMapProps = {
  regions: JourneyRegion[];
  hasHome: boolean;
  homeVersion: string | null;
  homeUnavailable: boolean;
  member: { id: string; name: string };
};

export function JourneyMap({ regions, hasHome, homeVersion, homeUnavailable, member }: JourneyMapProps) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const locations = useQuery(recordLocationsQueryOptions);
  const main = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const regionsButton = useRef<HTMLButtonElement>(null);
  const deletedRegion = useRef<JourneyRegion | null>(null);
  const restored = useRef(false);

  const [initialUrl] = useState(() =>
    readJourneyUrlState(searchParams, typeof window !== "undefined" && getPageNavigation(window).traversal),
  );
  const restoringDetail = Boolean(initialUrl.region && initialUrl.record && initialUrl.detail);
  const [restoring, setRestoring] = useState(Boolean(initialUrl.region && initialUrl.record));
  const [detailRecordId, setDetailRecordId] = useState(restoringDetail ? initialUrl.record : null);
  const [detailOpen, setDetailOpen] = useState(restoringDetail);
  const [region, setRegion] = useState<JourneyRegion | null>(null);
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
    viewport,
    unit,
    settled,
    stageRef,
    layerRef,
    headerRef,
    panelRef,
    handlers,
    setView,
    moveCamera,
    stop,
    toMapPoint,
    canTap,
    fitRoutes,
    followRoute,
  } = useMapCamera();
  const sheet = useJourneySheet(addressOpen);
  const journey = useJourneySession({
    routeQuery,
    camera: { viewRef, setView, moveCamera, stop, fitRoutes, followRoute },
    closeSheet: sheet.close,
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
    const search = toJourneySearch(
      window.location.search,
      session && {
        region: session.region.code,
        record: session.record.id,
        places: session.segments.flatMap((segment) => (segment.target ? [segment.target.id] : [])),
        detail: detailOpen,
      },
    );
    const url = `${window.location.pathname}${search}`;
    if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", url);
  }, [session, detailOpen]);

  const restoreJourney = useEffectEvent((rows: NonNullable<typeof locations.data>) => {
    setRestoring(false);
    if (sessionRef.current || sheet.kind !== null) return;

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
    sheet.show(null);
    moveCamera(national);
  };

  const openRegion = (selected: JourneyRegion) => {
    if (!homeReady && !homeUnavailable) {
      setRegion(selected);
      sheet.show(null);
      setAddressOpen(true);
      return;
    }

    if (selected.code !== region?.code) setSubregion(null);
    const rising = sheet.kind === "regions" || sheet.kind === "choices";
    if (!rising || prefersReducedMotion()) {
      setRegion(selected);
      sheet.show("records");
      return;
    }

    sheet.expandTo("records", () => setRegion(selected));
  };

  const chooseRegion = (selected: JourneyRegion, tap?: { clientX: number; clientY: number }) => {
    const point = tap && toMapPoint(tap.clientX, tap.clientY);
    const nearby = point
      ? regions.filter((item) => {
          const position = project(item.longitude, item.latitude);
          return Math.hypot(position.x - point.x, position.y - point.y) <= unit * NODE_HIT_RADIUS;
        })
      : [];
    if (nearby.length > 1) sheet.showChoices(nearby);
    else openRegion(selected);
  };

  const showRegionRecords = (target: JourneyRegion) => {
    setRegion(target);
    setSubregion(null);
    sheet.show("records");
  };

  const registerHome = () => {
    sheet.show(null);
    setAddressOpen(true);
  };

  const activeRecord = locations.data?.find((record) => record.id === session?.record.id);
  const drawn = expandView(view, MAP_OVERSCAN);
  const viewBox = `${drawn.x} ${drawn.y} ${drawn.width} ${drawn.height}`;

  return (
    <main
      ref={main}
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
      ) : (
        <h1 className="sr-only">기록 지도</h1>
      )}
      <div ref={stageRef} className={styles.stage} {...handlers}>
        <div ref={layerRef} className={styles.layer} style={{ "--map-overscan": MAP_OVERSCAN } as CSSProperties}>
          <svg className={styles.base} viewBox={viewBox} aria-hidden="true">
            <MapShapes />
            <DistrictShapes viewWidth={view.width} />
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
            {!session && !restoring && (
              <RegionNodes
                regions={regions}
                unit={unit}
                viewWidth={view.width}
                canTap={canTap}
                onChoose={chooseRegion}
              />
            )}
            <PlaceLabels
              places={journey.completeSegments.flatMap((segment) => (segment.target ? [segment.target] : []))}
              view={view}
              unit={unit}
              viewportWidth={viewport.width}
              settled={settled}
              canTap={canTap}
              onFocus={journey.focusPlace}
              onChoose={sheet.showPlaces}
            />
          </svg>
        </div>
      </div>
      <PageBackButton fallbackHref="/" />
      <FixedToolbar className="justify-end">
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
              requestAnimationFrame(() => regionsButton.current?.focus());
            }}
          />
        ) : (
          !restoring &&
          regions.length > 0 && (
            <div className={styles.actions}>
              <LiquidGlassButton
                ref={regionsButton}
                className="min-w-0 px-5 text-foreground text-sm"
                onClick={() => sheet.show("regions")}
              >
                지역 목록
              </LiquidGlassButton>
            </div>
          )
        )}
      </FixedToolbar>
      {!session && !restoring && !regions.length && <EmptyJourney />}
      {session && (
        <JourneyPanel
          ref={panelRef}
          session={session}
          onRecover={journey.recover}
          onFinishReplay={journey.finishReplay}
          onSelectPlace={journey.selectPlace}
          onPressPlace={journey.pressPlace}
        />
      )}
      {!session && regions.length > 0 && !homeReady && (
        <HomeNotice unavailable={homeUnavailable} onRegister={() => setAddressOpen(true)} />
      )}
      <JourneySheet
        open={sheet.kind !== null}
        kind={sheet.content}
        compactHeight={sheet.snap.compactHeight}
        snapPoint={sheet.snap.snapPoint}
        onSnapPointChange={sheet.snap.setSnapPoint}
        onClose={() => sheet.show(null)}
        onCloseComplete={() => {
          sheet.handleCloseComplete();
          if (!sessionRef.current && !addressOpen) setRegion(null);
        }}
        finalFocus={() => {
          if (addressOpen || detailOpen) return false;
          if (sessionRef.current) return title.current;

          const opener = sheet.opener.current;
          if (opener instanceof SVGElement && opener.isConnected) {
            opener.focus();
            return false;
          }
          return true;
        }}
      >
        {sheet.content === "records" ? (
          <RegionRecords
            region={region}
            homeReady={homeReady}
            homeUnavailable={homeUnavailable}
            currentRecordId={session?.record.id}
            subregion={subregion}
            onSubregionChange={setSubregion}
            onRecordOpen={(recordId) => {
              const record = journeyRecord(recordId);
              if (record && region) journey.begin(record, region);
            }}
            onRecordPress={(recordId) => {
              const record = journeyRecord(recordId);
              if (record && region) void queryClient.prefetchQuery(routeQuery(record, region, null, null));
            }}
            onRegisterHome={registerHome}
          />
        ) : (
          sheet.content && (
            <RegionChoices
              kind={sheet.content}
              regions={sheet.content === "choices" ? sheet.choices : regions}
              places={sheet.places}
              headerRef={sheet.snap.setHeader}
              bodyRef={sheet.snap.setBody}
              onRegion={openRegion}
              onPlace={(place) => {
                sheet.show(null);
                journey.focusPlace(place);
              }}
              onPlacesTogether={() => {
                sheet.show(null);
                moveCamera(placesBox(sheet.places, viewport));
              }}
            />
          )
        )}
      </JourneySheet>
      <HomeAddressSheet
        address={null}
        dark
        memberName={member.name}
        onOpenChange={setAddressOpen}
        onSaved={() => {
          setHomeSaved(true);
          if (region) sheet.show("records");
        }}
        open={addressOpen}
      />
      <RecordDetailBottomSheet
        backLabel="지도로"
        className="dark"
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
