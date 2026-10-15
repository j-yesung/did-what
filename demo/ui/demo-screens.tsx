"use client";

import { type ReactNode, useMemo, useState } from "react";

import { useSearchParams } from "next/navigation";

import { AppNotFound } from "@/app/ui/app-not-found";
import type { SavedPlaceRow } from "@/entities/place";
import { normalizeRecordCategory, normalizeRecordWeather, sortPrimaryRegionFirst } from "@/entities/record";
import { LogoutButton } from "@/features/auth";
import { CurrentMemberSetting, MemberSelect } from "@/features/member/select-member";
import { PushToggle } from "@/features/push-notification";
import { toExistingRecordLocationPlace, toShortRegionName } from "@/features/record/select-record-location";
import { RecordViewToggle } from "@/features/record/switch-record-view";
import { ThemeSelect } from "@/features/switch-theme";
import { HomeContent } from "@/pages/home/ui/home-content";
import { NotificationList } from "@/pages/notification/ui/notification-list";
import { PlaceDetailContent } from "@/pages/place/detail/ui/place-detail-content";
import { SavedPlaceList } from "@/pages/place/list/ui/saved-place-list";
import { RecordDetailContent } from "@/pages/record/detail/ui/record-detail-content";
import { RecordCalendar } from "@/pages/record/list/ui/record-calendar";
import { RecordListContent } from "@/pages/record/list/ui/record-list-content";
import { toSafeReturnTo } from "@/shared/lib/navigation/return-to";
import { cn } from "@/shared/lib/utils";
import { isIsoDate } from "@/shared/lib/validation/is-iso-date";
import { isUuid } from "@/shared/lib/validation/is-uuid";
import { PageHeader, PageSection, PageShell } from "@/shared/ui/layouts";
import { PageBackSlot } from "@/shared/ui/layouts/page-back-button";
import { ListHeader } from "@/shared/ui/list-header";
import { OverscrollBack } from "@/shared/ui/overscroll-back";
import { AppToolbar } from "@/widgets/app-toolbar";
import { BottomNavigation } from "@/widgets/bottom-navigation";
import { RecordCreateFunnel } from "@/widgets/record-form/funnel/create-record-funnel";
import { RecordEditForm } from "@/widgets/record-form/record-edit-form";

import { toDemoHref } from "../lib/demo-href";
import { getSavedPlaceRows, toDetailRow } from "../model/queries";
import { demoStore, useDemoState } from "../model/store";
import { useDemo } from "./demo-context";

type Member = { id: string; name: string };

/*
 * 각 화면은 app/ 의 서버 page·layout이 하던 조합을 샘플 데이터로 다시 맞춘 것이다.
 * 화면 안의 컴포넌트는 실제 앱 것을 그대로 쓰고, 서버에서 받던 값만 체험 데이터에서 넘긴다.
 */

/** app/(app)/layout.tsx와 같은 뼈대. */
export function DemoAppFrame({ children, member }: { children: ReactNode; member: Member }) {
  return (
    <>
      <AppToolbar memberId={member.id} />
      <PageBackSlot />
      {children}
      <BottomNavigation />
    </>
  );
}

/** app/(app)/(map)의 layout·template·page. */
export function DemoHomeScreen({ member }: { member: Member }) {
  return (
    <PageShell className="motion-safe:animate-none" withBottomNavigation>
      <div aria-hidden="true" className="h-(--toolbar-height) shrink-0" />
      <div className="flex min-h-0 flex-1 flex-col gap-5 motion-safe:animate-[var(--tab-enter-name,tab-content-enter)_160ms_cubic-bezier(0.2,0,0,1)_both]">
        <HomeContent member={member} />
      </div>
    </PageShell>
  );
}

/** pages/record/list의 RecordsPage. 보기 선택은 쿠키 대신 체험 데이터에 둔다. */
export function DemoRecordsScreen({ member }: { member: Member }) {
  const searchParams = useSearchParams();
  const { recordView } = useDemoState();
  const search = searchParams?.toString() ?? "";
  const params = useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);
  const view =
    params.view === "calendar" || (Object.keys(params).length === 0 && recordView === "calendar") ? "calendar" : "list";

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30">
        <div className="mx-auto flex w-full max-w-(--app-width) items-start px-5 pt-(--page-top)">
          <RecordViewToggle view={view} />
        </div>
      </div>
      <PageShell className={cn("gap-4", view === "calendar" && "h-(--screen-height)")} withBottomNavigation>
        <header className="min-h-13">
          <h1 className="sr-only">우리의 기록</h1>
        </header>

        {view === "calendar" ? <RecordCalendar member={member} /> : <RecordListContent />}
      </PageShell>
    </>
  );
}

/** pages/record/new. 기본 날짜는 샘플 데이터의 기준일(오늘)이다. */
export function DemoRecordNewScreen() {
  const searchParams = useSearchParams();
  const { createRecord } = useDemo();
  const [props] = useState(() => {
    const state = demoStore.get();
    const date = searchParams?.get("date");
    const placeId = searchParams?.get("placeId");
    const defaultRecordedAt = date && isIsoDate(date) ? date : state.today;
    const calendarHref = defaultRecordedAt === date ? `/records?view=calendar&month=${date.slice(0, 7)}` : "/records";
    const place =
      placeId && isUuid(placeId)
        ? state.places.find(({ id, region_name }) => id === placeId && region_name)
        : undefined;
    const returnHref = toDemoHref(place ? `/places/${place.id}` : calendarHref);

    return {
      defaultPlace: place ? toExistingRecordLocationPlace(place) : undefined,
      defaultRecordedAt,
      returnTo: returnHref,
      savedTo: returnHref,
    };
  });

  return (
    <PageShell className="h-(--screen-height) min-h-0 gap-0 overflow-hidden px-0 pt-0 pb-0">
      <RecordCreateFunnel action={createRecord} {...props} />
    </PageShell>
  );
}

export function DemoRecordDetailScreen({ member, recordId }: { member: Member; recordId: string }) {
  if (!isUuid(recordId)) return <AppNotFound />;
  return <RecordDetailContent key={recordId} member={member} recordId={recordId} />;
}

/** pages/record/edit. 초기값을 만드는 규칙도 실제 화면과 같다. */
export function DemoRecordEditScreen({ recordId }: { recordId: string }) {
  const { updateRecord } = useDemo();
  const [initial] = useState(() => {
    const state = demoStore.get();
    const record = state.records.find(({ id }) => id === recordId);
    return record ? { record: toDetailRow(state, record), savedPlaces: getSavedPlaceRows(state) } : null;
  });

  if (!isUuid(recordId) || !initial) return <AppNotFound />;

  const { record, savedPlaces } = initial;
  const backHref = toDemoHref(`/records/${recordId}`);

  return (
    <OverscrollBack fallbackHref={backHref}>
      <PageShell className="block">
        <h1 className="sr-only">기록 수정</h1>
        <PageHeader back={backHref} />

        <section className="px-1 pt-5.5 pb-5" aria-labelledby="record-edit-title">
          <h2
            className="font-[780] text-[clamp(24px,7vw,30px)] leading-tight tracking-[-0.045em]"
            id="record-edit-title"
          >
            그날의 기록을 다듬어보세요.
          </h2>
          <p className="mt-2 text-[14px] text-muted-foreground leading-[1.6]">
            바뀐 날짜, 지역과 방문 장소를 한 번에 수정할 수 있어요.
          </p>
        </section>

        <RecordEditForm
          action={(formData) => updateRecord(recordId, formData)}
          initialSavedPlaces={savedPlaces as SavedPlaceRow[]}
          initialValues={{
            activity: record.activity,
            category: normalizeRecordCategory(record.category),
            memo: record.memo ?? "",
            places: sortPrimaryRegionFirst(
              record.record_places,
              record.region_code,
              ({ place }) => place.region_code,
            ).map(({ place }) => toExistingRecordLocationPlace(place)),
            recordedAt: record.recorded_at,
            recordedUntil: record.recorded_until,
            regions: sortPrimaryRegionFirst(record.record_regions, record.region_code, (region) => region.region_code)
              .filter(({ selected_directly: selectedDirectly }) => selectedDirectly)
              .map((region) => ({
                code: region.region_code,
                fullName: region.region_name,
                label: region.region_label,
                latitude: region.region_latitude,
                longitude: region.region_longitude,
                name: toShortRegionName(region.region_name),
              })),
            weather: normalizeRecordWeather(record.weather),
          }}
          returnTo={backHref}
          savedTo={backHref}
        />
      </PageShell>
    </OverscrollBack>
  );
}

/** pages/place/list. 카카오 검색 대신 샘플 장소에서 찾는다. */
export function DemoPlacesScreen() {
  const searchParams = useSearchParams();
  const state = useDemoState();
  const initialPlaces = getSavedPlaceRows(state) as SavedPlaceRow[];
  return (
    <PageShell className="gap-4" withBottomNavigation>
      <header className="min-h-13">
        <h1 className="sr-only">내 장소</h1>
      </header>
      <SavedPlaceList initialPlaces={initialPlaces} initialSearchQuery={searchParams?.get("q") ?? undefined} />
    </PageShell>
  );
}

export function DemoPlaceDetailScreen({ placeId }: { placeId: string }) {
  if (!isUuid(placeId)) return <AppNotFound />;
  return <PlaceDetailContent key={placeId} placeId={placeId} />;
}

export function DemoNotificationsScreen({ member }: { member: Member }) {
  return (
    <OverscrollBack fallbackHref={toDemoHref("/")}>
      <NotificationList memberId={member.id} />
    </OverscrollBack>
  );
}

export function DemoSettingsScreen({ member }: { member: Member }) {
  const { theme, members } = useDemoState();

  return (
    <PageShell className="gap-4" withBottomNavigation>
      <header className="min-h-13">
        <h1 className="sr-only">설정</h1>
      </header>

      <div className="flex flex-1 flex-col">
        <PageSection className="pt-4 pb-4">
          <CurrentMemberSetting member={member} members={members} />
        </PageSection>
        <PageSection className="pt-4 pb-4">
          <ThemeSelect value={theme} />
        </PageSection>
        <PageSection className="pt-4 pb-4">
          <PushToggle />
        </PageSection>
        <PageSection className="mt-auto pt-4">
          <LogoutButton />
        </PageSection>
      </div>
    </PageShell>
  );
}

export function DemoMemberSelectScreen() {
  const searchParams = useSearchParams();
  const { currentMemberId, members } = useDemoState();
  const destination = toSafeReturnTo(searchParams?.get("returnTo"));

  return (
    <PageShell className="gap-8">
      {destination === "/settings" ? (
        <div className="flex flex-col gap-5">
          <PageHeader back={toDemoHref("/settings")} title="누가 사용 중인가요?" />
        </div>
      ) : (
        <ListHeader title="누가 사용 중인가요?" />
      )}
      <MemberSelect
        currentMemberId={currentMemberId ?? undefined}
        destination={destination}
        members={members.filter((member) => member.is_active)}
      />
    </PageShell>
  );
}
