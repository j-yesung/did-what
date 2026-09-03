import { getRecordLocations } from "@/entities/record/server";
import { requireUser } from "@/shared/api/supabase/require-user";

import { RegionsContent } from "./ui/regions-content";

export async function RegionsPage() {
  const { user } = await requireUser();
  const initialRecords = await getRecordLocations(user.id);

  return <RegionsContent initialRecords={initialRecords} />;
}
