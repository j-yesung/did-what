"use client";

import { usePrefetchQuery } from "@tanstack/react-query";

import { peopleQueryOptions } from "@/entities/person/api/people-query";
import { placesQueryOptions } from "@/entities/place/api/places-query";
import { profileQueryOptions } from "@/entities/profile/api/profile-query";
import { recordsQueryOptions } from "@/entities/record/api/records-query";

export function MainDataPrefetch() {
  usePrefetchQuery(recordsQueryOptions);
  usePrefetchQuery(peopleQueryOptions);
  usePrefetchQuery(placesQueryOptions);
  usePrefetchQuery(profileQueryOptions);

  return null;
}
