import { CalendarDaysIcon, MapPinIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

import { formatRecordDate } from "@/shared/lib/date/format-date";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { TextButton } from "@/shared/ui/text-button";

type RecordCardProps = {
  activity: string;
  memo?: string | null;
  peopleNames?: string[];
  recordId: string;
  recordedAt: string;
  region?: { label: string; name: string };
};

export function RecordCard({ activity, memo, peopleNames, recordId, recordedAt, region }: RecordCardProps) {
  return (
    <article className="relative pl-5">
      <span
        className="absolute top-5 left-0 size-3.75 rounded-full border-4 border-background bg-primary"
        aria-hidden="true"
      />
      <Card>
        <CardHeader>
          <CardTitle>{activity}</CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <CalendarDaysIcon className="size-4" aria-hidden="true" />
            {formatRecordDate(recordedAt)}
          </CardDescription>
        </CardHeader>

        {region || memo ? (
          <CardContent className="flex flex-col gap-3">
            {region ? (
              <p className="flex items-center gap-2 text-sm">
                <MapPinIcon className="size-4 shrink-0 text-foreground" aria-hidden="true" />
                {region.label} / {region.name}
              </p>
            ) : null}
            {memo ? <p className="text-muted-foreground text-sm leading-relaxed">{memo}</p> : null}
          </CardContent>
        ) : null}

        <CardFooter className={cn("gap-3", peopleNames ? "justify-between" : "justify-end")}>
          {peopleNames ? (
            <div className="flex min-w-0 items-center gap-2">
              <UsersIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <p className="truncate text-muted-foreground text-xs">{peopleNames.join(", ") || "함께한 사람 없음"}</p>
            </div>
          ) : null}
          <TextButton
            nativeButton={false}
            render={<Link href={`/records/${recordId}`} />}
            size="sm"
            tone="muted"
            variant="arrow"
          >
            기록 보기
          </TextButton>
        </CardFooter>
      </Card>
    </article>
  );
}
