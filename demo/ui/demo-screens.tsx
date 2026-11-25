"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { AppLoading } from "@/app/ui/app-loading";
import { AppNotFound } from "@/app/ui/app-not-found";
import { RecordSearchProvider } from "@/entities/record/ui/record-search-provider";
import { getRegion } from "@/entities/region/model/region";
import { LogoutButton } from "@/features/auth";
import { CurrentMemberSetting, MemberSelect } from "@/features/member/select-member";
import { MetOnSetting } from "@/features/met-on/ui/met-on-setting";
import { PushToggle } from "@/features/push-notification";
import { toExistingRecordLocationPlace } from "@/features/record/select-record-location";
import { ThemeSelect } from "@/features/switch-theme";
import { HomeDashboard } from "@/pages/home/ui/home-dashboard";
import { NotificationList } from "@/pages/notification/ui/notification-list";
import { PlaceDetailContent } from "@/pages/place/detail/ui/place-detail-content";
import { PlaceSearchBottomSheet } from "@/pages/place/list/ui/place-search-bottom-sheet";
import { SavedPlaceList } from "@/pages/place/list/ui/saved-place-list";
import { getRecordViewFromParams } from "@/pages/record/list/model/record-view";
import { RecordsContent } from "@/pages/record/list/ui/records-content";
import { toSafeReturnTo } from "@/shared/lib/navigation/return-to";
import { isIsoDate } from "@/shared/lib/validation/is-iso-date";
import { isUuid } from "@/shared/lib/validation/is-uuid";
import { PageHeader, PageSection, PageShell } from "@/shared/ui/layouts";
import { PageBackSlot } from "@/shared/ui/layouts/page-back-button";
import { ListHeader } from "@/shared/ui/list-header";
import { OverscrollBack } from "@/shared/ui/overscroll-back";
import { BottomNavigation } from "@/widgets/bottom-navigation";
import { RecordRouteSheet } from "@/widgets/record-detail";
import { toRecordEditValues } from "@/widgets/record-form/model/record-edit-values";
import { createRecordFormDraft } from "@/widgets/record-form/model/record-form-draft";
import { RecordForm } from "@/widgets/record-form/record-form";
import { Toolbar } from "@/widgets/toolbar";

import { toDemoHref, toDemoRecordSheetHref } from "../lib/demo-href";
import {
  ANNIVERSARY_CARD_STYLE_PARAM,
  getAnniversaryCardStyle,
  getAnniversaryNamesForDate,
} from "../model/anniversaries";
import { getDemoHomeRecords, toDetailRow } from "../model/queries";
import { demoStore, useDemoState } from "../model/store";
import { DemoAnniversarySheet } from "./demo-anniversary-sheet";
import { useDemo } from "./demo-context";

type Member = { id: string; name: string };

export function DemoAppFrame({ children, member }: { children: ReactNode; member: Member }) {
  return (
    <RecordSearchProvider>
      <Toolbar memberId={member.id} />
      <PageBackSlot />
      {children}
      <BottomNavigation />
      <RecordRouteSheet member={member} />
    </RecordSearchProvider>
  );
}

export function DemoHomeScreen({ member }: { member: Member }) {
  const state = useDemoState();
  const searchParams = useSearchParams();
  const records = useMemo(() => getDemoHomeRecords(state), [state]);
  const style = getAnniversaryCardStyle(searchParams?.get(ANNIVERSARY_CARD_STYLE_PARAM) ?? null);

  return (
    <HomeDashboard
      anniversaryCard={<DemoAnniversarySheet style={style} />}
      member={member}
      metOn={state.metOn}
      records={records}
      today={state.today}
    />
  );
}

export function DemoRecordsScreen() {
  const searchParams = useSearchParams();
  const { anniversaries, recordView } = useDemoState();
  const search = searchParams?.toString() ?? "";
  const view = getRecordViewFromParams(Object.fromEntries(new URLSearchParams(search))) ?? recordView ?? "list";
  const anniversaryNamesForDate = useCallback(
    (date: string) => getAnniversaryNamesForDate(anniversaries, date),
    [anniversaries],
  );
  return <RecordsContent anniversaryNamesForDate={anniversaryNamesForDate} view={view} />;
}

export function DemoRecordNewScreen() {
  const searchParams = useSearchParams();
  const { createRecord } = useDemo();
  const [props] = useState(() => {
    const state = demoStore.get();
    const date = searchParams?.get("date");
    const placeId = searchParams?.get("placeId");
    const searchRegion = getRegion(searchParams?.get("region") ?? "");
    const defaultRecordedAt = date && isIsoDate(date) ? date : state.today;
    const calendarHref = defaultRecordedAt === date ? `/records?view=calendar&month=${date.slice(0, 7)}` : "/records";
    const place =
      placeId && isUuid(placeId)
        ? state.places.find(({ id, region_name }) => id === placeId && region_name)
        : undefined;
    const returnHref = toDemoHref(
      place ? `/places/${place.id}` : searchRegion ? `/?region=${searchRegion.code}` : calendarHref,
    );

    return {
      initialValues: createRecordFormDraft(defaultRecordedAt, place ? toExistingRecordLocationPlace(place) : undefined),
      savedTo: returnHref,
    };
  });

  return (
    <PageShell className="h-(--screen-height) min-h-0 gap-0 overflow-hidden px-0 pt-0 pb-0">
      <RecordForm action={createRecord} fallbackHref={toDemoHref("/")} mode="create" {...props} />
    </PageShell>
  );
}

export function DemoRecordDetailScreen({ recordId }: { recordId: string }) {
  if (!isUuid(recordId)) return <AppNotFound />;
  return <DemoRecordDetailRedirect recordId={recordId} />;
}

function DemoRecordDetailRedirect({ recordId }: { recordId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams?.toString() ?? "";
  useEffect(() => {
    const href = toDemoRecordSheetHref(`/records/${recordId}?${query}${window.location.hash}`, "/records");
    if (href) router.replace(href, { scroll: false });
  }, [recordId, query, router]);
  return <AppLoading />;
}

export function DemoRecordEditScreen({ recordId }: { recordId: string }) {
  const { updateRecord } = useDemo();
  const [record] = useState(() => {
    const state = demoStore.get();
    const record = state.records.find(({ id }) => id === recordId);
    return record ? toDetailRow(state, record) : null;
  });

  if (!isUuid(recordId) || !record) return <AppNotFound />;

  const backHref = toDemoHref(`/records/${recordId}`);

  return (
    <PageShell className="h-(--screen-height) min-h-0 gap-0 overflow-hidden px-0 pt-0 pb-0">
      <RecordForm
        action={(formData) => updateRecord(recordId, formData)}
        initialValues={toRecordEditValues(record)}
        mode="edit"
        fallbackHref={toDemoHref("/")}
        savedTo={backHref}
      />
    </PageShell>
  );
}

export function DemoPlacesScreen() {
  const searchParams = useSearchParams();
  return (
    <>
      <PageShell className="gap-4" withBottomNavigation>
        <header className="min-h-13">
          <h1 className="sr-only">내 장소</h1>
        </header>
        <SavedPlaceList />
      </PageShell>
      <PlaceSearchBottomSheet initialQuery={searchParams?.get("q") ?? undefined} />
    </>
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
  const { members, metOn, theme } = useDemoState();

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
          <MetOnSetting metOn={metOn} />
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
