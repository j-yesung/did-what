import { RecordViewToggle } from "@/features/record/switch-record-view";
import { MapViewToggle } from "@/features/switch-map-view";

export function ToolbarViewToggle({ pathname }: { pathname: string }) {
  if (pathname === "/" || pathname === "/regions") {
    return <MapViewToggle />;
  }

  if (pathname === "/records") {
    return <RecordViewToggle />;
  }

  return null;
}
