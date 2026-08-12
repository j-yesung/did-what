"use client";

import type { FormEvent } from "react";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle>장소 검색</CardTitle>
        <CardDescription>상호명이나 지역을 함께 입력하면 더 정확하게 찾을 수 있어요.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="place-search-form" method="get" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={Boolean(searchError)}>
              <FieldLabel htmlFor="place-query">어디였나요?</FieldLabel>
              <Input
                aria-describedby={searchError ? "place-query-error" : undefined}
                aria-invalid={Boolean(searchError)}
                autoComplete="off"
                defaultValue={query}
                id="place-query"
                key={query}
                maxLength={100}
                name="q"
                placeholder="예: 성수 카페"
                required
                type="search"
              />
              <FieldError id="place-query-error">{searchError}</FieldError>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button className="w-full" form="place-search-form" type="submit">
          <SearchIcon data-icon="inline-start" />
          검색
        </Button>
      </CardFooter>
    </Card>
  );
}
