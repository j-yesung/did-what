"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

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
import { RecordCreateFunnel } from "@/widgets/record-form/funnel/create-record-funnel";
import { toRecordEditValues } from "@/widgets/record-form/model/record-edit-values";
import { RecordEditForm } from "@/widgets/record-form/record-edit-form";
import { Toolbar } from "@/widgets/toolbar";

import { toDemoHref, toDemoRecordSheetHref } from "../lib/demo-href";
import { getDemoHomeRecords, toDetailRow } from "../model/queries";
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
    <RecordSearchProvider>
      <Toolbar memberId={member.id} />
      <PageBackSlot />
      {children}
      <BottomNavigation />
      <RecordRouteSheet member={member} />
    </RecordSearchProvider>
  );
}

/** pages/home의 HomePage. 기록과 만난 날은 체험 데이터에서 받는다. */
export function DemoHomeScreen({ member }: { member: Member }) {
  const state = useDemoState();
  const records = useMemo(() => getDemoHomeRecords(state), [state]);

  return <HomeDashboard member={member} metOn={state.metOn} records={records} today={state.today} />;
}

/** pages/record/list의 RecordsPage. 보기 선택은 쿠키 대신 체험 데이터에 둔다. */
export function DemoRecordsScreen() {
  const searchParams = useSearchParams();
  const { recordView } = useDemoState();
  const search = searchParams?.toString() ?? "";
  const view = getRecordViewFromParams(Object.fromEntries(new URLSearchParams(search))) ?? recordView ?? "list";
  return <RecordsContent view={view} />;
}

/** pages/record/new. 기본 날짜는 샘플 데이터의 기준일(오늘)이다. */
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

/** pages/record/edit. 초기값을 만드는 규칙도 실제 화면과 같다. */
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
          initialValues={toRecordEditValues(record)}
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
