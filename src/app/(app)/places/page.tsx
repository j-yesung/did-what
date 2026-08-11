import { PlacesPage } from "@/_pages/places";

type PageProps = {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[] }>;
};

export default function Page({ searchParams }: PageProps) {
  return <PlacesPage searchParams={searchParams} />;
}
