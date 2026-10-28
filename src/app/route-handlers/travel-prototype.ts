import "server-only";

import { TRAVEL_DEMO_HOMES } from "@/app/route-handlers/travel-directions-model";
import { groupTravelRecords, type TravelRecord } from "@/app/route-handlers/travel-prototype-model";
import { requireUser } from "@/shared/api/supabase/require-user";

import { readFile } from "node:fs/promises";
import path from "node:path";

export const getTravelPrototype = async () => {
  const { supabase, user } = await requireUser();
  const records: TravelRecord[] = [];
  const pageSize = 500;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("records")
      .select(
        "id, activity, memo, recorded_at, created_at, record_regions(region_code, region_name, region_latitude, region_longitude), record_places(created_at, place:places(id, name, latitude, longitude))",
      )
      .eq("owner_id", user.id)
      .order("recorded_at", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) return new Response("기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.", { status: 500 });

    records.push(...data);
    if (data.length < pageSize) break;
  }

  const payload = groupTravelRecords(records);
  const data = JSON.stringify(payload).replace(
    /[<>&\u2028\u2029]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
  const html = await readFile(path.join(process.cwd(), "demo/travel-live.html"), "utf8");
  return new Response(
    html.replace(
      "<!-- LIVE_RECORDS -->",
      () =>
        `<script>window.__LIVE_RECORDS__=${data};window.__DEMO_HOMES__=${JSON.stringify(TRAVEL_DEMO_HOMES)}</script>`,
    ),
    {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" },
    },
  );
};
