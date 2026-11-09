"use client";

import { useQuery } from "@tanstack/react-query";

import { homeQueryOptions } from "../api/home-data";
import { HomeDashboard } from "./home-dashboard";

type HomeScreenProps = {
  member: { name: string };
  metOn: string | null;
};

export function HomeScreen({ member, metOn }: HomeScreenProps) {
  const { data } = useQuery({ ...homeQueryOptions, throwOnError: (_, query) => query.state.data === undefined });
  if (!data) return null;

  return <HomeDashboard member={member} metOn={metOn} records={data.records} today={data.today} />;
}
