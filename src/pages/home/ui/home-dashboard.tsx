"use client";

import { useCallback, useState } from "react";

import dynamic from "next/dynamic";

import { EmptyRecords } from "@/entities/record";
import { PageShell } from "@/shared/ui/layouts";

import { openRegionSheet } from "../model/region-sheet-url";
import {
  getGreeting,
  getRelationshipStats,
  type HomeRecord,
  pickAroundThisTime,
  pickUpcomingAnniversary,
  rankPlaces,
  summarizeRegions,
} from "../model/retrospect";
import { AnniversaryCard, HomeGreeting, RegionOverview, ThisTimeCard, TogetherCard, TopPlaces } from "./home-sections";
import { RecordListSheet, type RecordListSheetState } from "./record-list-sheet";

const RegionSheet = dynamic(() => import("./region-sheet").then((module) => module.RegionSheet), { ssr: false });
const RegionListSheet = dynamic(() => import("./region-sheet").then((module) => module.RegionListSheet), {
  ssr: false,
});

type HomeDashboardProps = {
  member: { name: string };
  metOn: string | null;
  records: HomeRecord[];
  today: string;
};

export function HomeDashboard({ member, metOn, records, today }: HomeDashboardProps) {
  const [sheet, setSheet] = useState<RecordListSheetState | null>(null);
  const closeSheet = useCallback(() => setSheet(null), []);
  const [regionListOpen, setRegionListOpen] = useState(false);
  const closeRegionList = useCallback(() => setRegionListOpen(false), []);

  const stats = getRelationshipStats(today, metOn);
  const thisTime = pickAroundThisTime(records, today);
  const anniversary = pickUpcomingAnniversary(records, today);
  const regions = summarizeRegions(records);
  const places = rankPlaces(records);

  return (
    <PageShell className="gap-5" withBottomNavigation>
      <HomeGreeting greeting={getGreeting(member.name)} />
      <TogetherCard stats={stats} />
      {thisTime && (
        <ThisTimeCard
          onOpen={() => setSheet({ records: thisTime.records, title: "이맘때의 기록" })}
          thisTime={thisTime}
        />
      )}
      {anniversary && <AnniversaryCard {...anniversary} />}
      {records.length > 0 ? (
        <RegionOverview
          onOpen={openRegionSheet}
          onOpenAll={() => setRegionListOpen(true)}
          records={records}
          regions={regions}
        />
      ) : (
        <EmptyRecords
          description="첫 기록을 남기면 함께한 시간과 다녀온 곳이 여기에 쌓여요."
          title="아직 돌아볼 기록이 없어요"
        />
      )}
      {places.length > 0 && <TopPlaces places={places} today={today} />}
      <RecordListSheet onClose={closeSheet} sheet={sheet} />
      <RegionListSheet onClose={closeRegionList} open={regionListOpen} records={records} regions={regions} />
      <RegionSheet records={records} regions={regions} />
    </PageShell>
  );
}
