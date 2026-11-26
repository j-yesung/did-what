import { AnniversaryManagement } from "@/features/manage-anniversaries/ui/anniversary-management";
import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { ListRowTexts } from "@/shared/ui/list-row";
import { PressLink } from "@/shared/ui/press-link";

import { toDemoHref } from "../lib/demo-href";
import {
  ANNIVERSARY_CARD_STYLE_PARAM,
  deleteAnniversary,
  getFeaturedAnniversary,
  saveAnniversary,
} from "../model/anniversaries";
import { demoStore, useDemoState } from "../model/store";
import type { DemoAnniversary, DemoAnniversaryCardStyle } from "../model/types";
import { DemoAnniversaryCard } from "./demo-anniversary-card";

export function DemoAnniversaryLink({ style }: { style: DemoAnniversaryCardStyle }) {
  const { anniversaries, today } = useDemoState();
  const featured = getFeaturedAnniversary(anniversaries, today);
  return (
    <PressLink
      className={cn("block rounded-[22px]", PRESS_FEEDBACK, FOCUS_RING)}
      href={`/anniversaries?${ANNIVERSARY_CARD_STYLE_PARAM}=${style}`}
      prefetch={false}
    >
      <DemoAnniversaryCard anniversary={featured} style={style} />
      <span className="sr-only"> 기념일 관리 열기</span>
    </PressLink>
  );
}

export function DemoAnniversariesPage({ style }: { style: DemoAnniversaryCardStyle }) {
  const { anniversaries, today } = useDemoState();
  return (
    <PageShell>
      <PageHeader back={toDemoHref(`/?${ANNIVERSARY_CARD_STYLE_PARAM}=${style}`)} title="기념일 관리" />
      <AnniversaryManagement
        anniversaries={anniversaries.toSorted((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))}
        today={today}
        renderListLabel={(anniversary) => <AnniversaryListLabel anniversary={anniversary} style={style} />}
        formStyle={style === "night" ? undefined : style}
        onCreate={async (draft) => {
          const result = saveAnniversary(demoStore.get(), draft);
          if (!result.ok) return { status: "error", message: result.message };
          demoStore.set(result.state);
          return { status: "success" };
        }}
        onDelete={async (id) => {
          demoStore.update((state) => deleteAnniversary(state, id));
          return { status: "success" };
        }}
      />
    </PageShell>
  );
}

type AnniversaryListLabelProps = {
  anniversary: DemoAnniversary;
  style: DemoAnniversaryCardStyle;
};

function AnniversaryListLabel({ anniversary, style }: AnniversaryListLabelProps) {
  const { date, name } = anniversary;
  const monthDay = date.slice(5);
  const [month, day] = monthDay.split("-").map(Number);
  const formattedDate = `${month}월 ${day}일`;

  if (style === "date") {
    return (
      <>
        <Badge className="bg-primary/10 text-accent-text">
          <time dateTime={monthDay}>{formattedDate}</time>
        </Badge>
        <ListRowTexts className="flex-1" title={name} />
      </>
    );
  }

  if (style === "line") {
    return (
      <>
        <ListRowTexts className="flex-1" title={name} />
        <time
          aria-label={formattedDate}
          className="shrink-0 text-muted-foreground text-xs tabular-nums"
          dateTime={monthDay}
        >
          {monthDay.replace("-", ".")}
        </time>
      </>
    );
  }

  return (
    <ListRowTexts className="flex-1" description={<time dateTime={monthDay}>{formattedDate}</time>} title={name} />
  );
}
