import { AnniversarySheet } from "@/features/manage-anniversaries/ui/anniversary-sheet";
import { formatRecordDate } from "@/shared/lib/date/format-date";
import { Badge } from "@/shared/ui/badge";
import { ListRowTexts } from "@/shared/ui/list-row";

import { deleteAnniversary, getFeaturedAnniversary, saveAnniversary } from "../model/anniversaries";
import { demoStore, useDemoState } from "../model/store";
import type { DemoAnniversary, DemoAnniversaryCardStyle } from "../model/types";
import { DemoAnniversaryCard } from "./demo-anniversary-card";

export function DemoAnniversarySheet({ style }: { style: DemoAnniversaryCardStyle }) {
  const { anniversaries, today } = useDemoState();
  const featured = getFeaturedAnniversary(anniversaries, today);
  return (
    <AnniversarySheet
      anniversaries={anniversaries}
      today={today}
      trigger={<DemoAnniversaryCard anniversary={featured} style={style} />}
      renderListLabel={(anniversary) => <AnniversaryListLabel anniversary={anniversary} style={style} />}
      formStyle={style}
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
  );
}

type AnniversaryListLabelProps = {
  anniversary: DemoAnniversary;
  style: DemoAnniversaryCardStyle;
};

function AnniversaryListLabel({ anniversary, style }: AnniversaryListLabelProps) {
  const { date, name } = anniversary;
  const formattedDate = formatRecordDate(date);

  if (style === "date") {
    const [year, month, day] = date.split("-").map(Number);
    return (
      <>
        <Badge className="bg-primary/10 text-accent-text">
          <time dateTime={date}>
            <span className="sr-only">{year}년 </span>
            {month}월 {day}일
          </time>
        </Badge>
        <ListRowTexts className="flex-1" description={`${year}년부터`} title={name} />
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
          dateTime={date}
        >
          {date.replaceAll("-", ".")}
        </time>
      </>
    );
  }

  return <ListRowTexts className="flex-1" description={<time dateTime={date}>{formattedDate}</time>} title={name} />;
}
