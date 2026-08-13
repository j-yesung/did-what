"use client";

import type { FormEvent } from "react";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

type PlaceSearchFormProps = {
  query: string;
  searchError?: string;
};

export function PlaceSearchForm({ query, searchError }: PlaceSearchFormProps) {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const searchQuery = new FormData(event.currentTarget).get("q");

    router.push(`/places?${new URLSearchParams({ q: String(searchQuery ?? "") })}`);
  }

  return (
    <form id="place-search-form" method="get" onSubmit={handleSubmit} role="search">
      <FieldGroup>
        <Field data-invalid={Boolean(searchError)}>
          <FieldLabel className="sr-only" htmlFor="place-query">
            장소 검색
          </FieldLabel>
          <div className="flex gap-2">
            <Input
              aria-describedby={searchError ? "place-query-error" : undefined}
              aria-invalid={Boolean(searchError)}
              autoComplete="off"
              className="h-11 flex-1"
              defaultValue={query}
              id="place-query"
              key={query}
              maxLength={100}
              name="q"
              placeholder="예: 성수 카페"
              required
              type="search"
            />
            <Button aria-label="장소 검색" className="size-11" size="icon-lg" type="submit">
              <SearchIcon aria-hidden="true" />
            </Button>
          </div>
          <FieldError id="place-query-error">{searchError}</FieldError>
        </Field>
      </FieldGroup>
    </form>
  );
}
