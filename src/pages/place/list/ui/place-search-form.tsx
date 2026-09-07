"use client";

import { type SubmitEvent, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { SearchField } from "@/shared/ui/search-field";

import { navigatePlaceSearch } from "../model/place-search-navigation";

type PlaceSearchFormProps = {
  query: string;
  searchError?: string;
};

export function PlaceSearchForm({ query, searchError }: PlaceSearchFormProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(query);
  const fieldError = keyword === query ? searchError : undefined;

  useEffect(() => setKeyword(query), [query]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    navigatePlaceSearch(window, router, keyword);
  }

  return (
    <form id="place-search-form" method="get" onSubmit={handleSubmit} role="search">
      <FieldGroup>
        <Field data-invalid={Boolean(fieldError)}>
          <FieldLabel className="sr-only" htmlFor="place-query">
            장소 검색
          </FieldLabel>
          <SearchField
            aria-describedby={fieldError ? "place-query-error" : undefined}
            aria-invalid={Boolean(fieldError)}
            autoComplete="off"
            id="place-query"
            maxLength={100}
            name="q"
            onClear={() => navigatePlaceSearch(window, router, "")}
            onValueChange={setKeyword}
            placeholder="예: 성수 카페"
            value={keyword}
          />
          <FieldError id="place-query-error">{fieldError}</FieldError>
        </Field>
      </FieldGroup>
    </form>
  );
}
