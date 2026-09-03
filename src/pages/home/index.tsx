import { getRecordLocations } from "@/entities/record/server";
import { requireUser } from "@/shared/api/supabase/require-user";

import { HomeContent } from "./ui/home-content";

export async function HomePage() {
  const { user } = await requireUser();
  const initialRecords = await getRecordLocations(user.id);

  return <HomeContent initialRecords={initialRecords} />;
}
