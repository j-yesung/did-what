"use client";

import type { FormEvent } from "react";

import { ArrowCounterClockwiseIcon, CalendarDotsIcon, CaretDownIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  buildRecordsHref,
  hasRecordFilters,
  type RecordFilters,
  type RecordSort,
} from "@/entities/record/model/record-filters";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

const SORT_OPTIONS: { label: string; value: RecordSort }[] = [
  { label: "최신순", value: "recent" },
  { label: "오래된순", value: "oldest" },
];

type RecordFilterFormProps = {
  filters: RecordFilters;
};

export function RecordFilterForm({ filters }: RecordFilterFormProps) {
  const router = useRouter();
  const hasPeriod = Boolean(filters.from || filters.to);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string" && value) params.set(key, value);
    }

    router.push(`/records?${params.toString()}`);
  }

  return (
    <form action="/records" className="flex flex-col gap-2.5" method="get" onSubmit={handleSubmit} role="search">
      <input name="sort" type="hidden" value={filters.sort} />

      <div className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            strokeWidth={2}
            className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="기록 검색"
            className="h-11 rounded-lg pl-11"
            defaultValue={filters.query}
            maxLength={100}
            name="q"
            placeholder="검색어를 입력하세요"
            type="search"
          />
        </div>
        <Button aria-label="검색" className="h-11 rounded-lg px-5" type="submit">
          <MagnifyingGlassIcon strokeWidth={2} aria-hidden="true" />
        </Button>
      </div>

      <details className="group rounded-xl border bg-card px-4 py-3" open={hasPeriod}>
        <summary className="flex min-w-0 cursor-pointer list-none items-center gap-2 font-medium text-sm [&::-webkit-details-marker]:hidden">
          <CalendarDotsIcon strokeWidth={2} className="size-4.5 text-foreground" aria-hidden="true" />
          기간
          {hasPeriod ? (
            <Badge className="min-w-0 shrink truncate" tone="primary">
              {filters.from || "처음"} ~ {filters.to || "오늘"}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">전체</span>
          )}
          <CaretDownIcon
            strokeWidth={2}
            className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>

        <div className="mt-3 flex items-center gap-2">
          <Input aria-label="시작일" className="h-10 flex-1" defaultValue={filters.from} name="from" type="date" />
          <span className="text-muted-foreground text-sm" aria-hidden="true">
            ~
          </span>
          <Input aria-label="종료일" className="h-10 flex-1" defaultValue={filters.to} name="to" type="date" />
        </div>
        <Button className="mt-3 w-full" type="submit" variant="outline">
          기간 적용
        </Button>
      </details>

      <div className="flex items-center gap-1.5">
        <div className="flex gap-1.5" role="group" aria-label="정렬">
          {SORT_OPTIONS.map(({ label, value }) => {
            const active = filters.sort === value;

            return (
              <Link
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex h-8 items-center rounded-md border px-3 font-[650] text-xs transition-colors",
                  active ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground",
                )}
                href={buildRecordsHref(filters, { sort: value })}
                key={value}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {hasRecordFilters(filters) ? (
          <Link
            className="ml-auto flex h-8 items-center gap-1 rounded-md px-2.5 font-[650] text-muted-foreground text-xs"
            href="/records"
          >
            <ArrowCounterClockwiseIcon strokeWidth={2} className="size-3.5" aria-hidden="true" />
            초기화
          </Link>
        ) : null}
      </div>
    </form>
  );
}
