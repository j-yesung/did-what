import { CalendarDotsIcon, MapPinIcon, UsersIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { formatRecordPeriod } from "@/shared/lib/date/format-date";
import { FOCUS_RING, PRESS_FEEDBACK_LARGE, PRESS_SURFACE } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";

type RecordCardProps = {
  activity: string;
  memo?: string | null;
  peopleNames?: string[];
  recordId: string;
  recordedAt: string;
  recordedUntil?: string | null;
  region?: { label: string; name: string };
};

export function RecordCard({
  activity,
  memo,
  peopleNames,
  recordId,
  recordedAt,
  recordedUntil,
  region,
}: RecordCardProps) {
  return (
    <article className="relative pl-5">
      {/* 점은 세로선 위에 있어야 해서 카드와 같이 줄지 않는다. 누르는 동안 점과 카드 간격이 2px쯤 벌어지는데,
          카드를 왼쪽 가장자리 기준으로 줄이면 이건 없어지지만 카드가 통째로 눌리는 느낌을 잃는다. 후자를 택했다. */}
      <span
        className="absolute top-5 left-0 size-3.75 rounded-full border-4 border-background bg-primary"
        aria-hidden="true"
      />
      <Link
        className={cn("block rounded-xl", FOCUS_RING, PRESS_FEEDBACK_LARGE)}
        data-press=""
        href={`/records/${recordId}`}
      >
        <Card className={PRESS_SURFACE}>
          <CardHeader>
            <CardTitle>{activity}</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <CalendarDotsIcon strokeWidth={2} className="size-4" aria-hidden="true" />
              {formatRecordPeriod(recordedAt, recordedUntil)}
            </CardDescription>
          </CardHeader>

          {region || memo ? (
            <CardContent className="flex flex-col gap-3">
              {region ? (
                <p className="flex items-center gap-2 text-sm">
                  <MapPinIcon strokeWidth={2} className="size-4 shrink-0 text-foreground" aria-hidden="true" />
                  {region.label} / {region.name}
                </p>
              ) : null}
              {memo ? <p className="text-muted-foreground text-sm leading-relaxed">{memo}</p> : null}
            </CardContent>
          ) : null}

          {peopleNames ? (
            <CardFooter>
              <div className="flex min-w-0 items-center gap-2">
                <UsersIcon strokeWidth={2} className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <p className="truncate text-muted-foreground text-xs">{peopleNames.join(", ") || "함께한 사람 없음"}</p>
              </div>
            </CardFooter>
          ) : null}
        </Card>
      </Link>
    </article>
  );
}
