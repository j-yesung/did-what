"use client";

import { UserCircleIcon, UsersIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { peopleQueryOptions } from "@/entities/person/api/people-query";
import { CreatePersonForm } from "@/features/manage-person";
import { formatShortDate } from "@/shared/lib/date/format-date";
import { FOCUS_RING, PRESS_FEEDBACK_LARGE, PRESS_SURFACE } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { Spinner } from "@/shared/ui/spinner";

export function PeoplePage() {
  const peopleQuery = useQuery(peopleQueryOptions);
  const people = peopleQuery.data ?? [];
  const personCount = people.length;

  return (
    <PageShell withBottomNavigation>
      <PageHeader title="사람" />

      <section className="px-1" aria-labelledby="people-intro-title">
        <p className="font-bold text-foreground text-xs">{personCount}명과 함께 기록 중</p>
        <h2 id="people-intro-title" className="mt-2 font-bold text-2xl tracking-[-0.04em]">
          기억 속 사람들을 모아보세요.
        </h2>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
          추가한 사람은 기록을 남길 때 바로 선택할 수 있어요.
        </p>
      </section>

      <CreatePersonForm />

      {peopleQuery.isPending ? (
        <div className="grid min-h-40 place-items-center">
          <Spinner
            aria-label="사람 목록을 불러오는 중"
            className="motion-safe:fade-in size-6 text-muted-foreground motion-safe:animate-in motion-safe:fill-mode-both motion-safe:delay-300"
          />
        </div>
      ) : peopleQuery.isError ? (
        <LoadErrorAlert icon={<UsersIcon strokeWidth={2} aria-hidden="true" />} title="사람 목록을 불러오지 못했어요" />
      ) : people.length ? (
        <section className="flex flex-col gap-3" aria-label={`함께한 사람 ${people.length}명`}>
          {people.map((person) => (
            <Link
              className={cn("block rounded-xl", FOCUS_RING, PRESS_FEEDBACK_LARGE)}
              href={`/people/${person.id}`}
              key={person.id}
            >
              <Card className={PRESS_SURFACE} size="sm">
                <CardHeader>
                  <CardTitle>{person.name}</CardTitle>
                  <CardDescription>함께한 사람</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs">기록에서 이 사람을 선택할 수 있어요.</p>
                </CardContent>
                <CardFooter>
                  <p className="text-muted-foreground text-xs">{formatShortDate(person.created_at)} 추가</p>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </section>
      ) : (
        <Empty className="border bg-card py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserCircleIcon strokeWidth={2} aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>아직 추가한 사람이 없어요</EmptyTitle>
            <EmptyDescription>위 입력란에 첫 번째 이름을 적어 함께한 사람을 추가해 보세요.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </PageShell>
  );
}
