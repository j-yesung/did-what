import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";

import { getRecordCategoryLabel, normalizeRecordCategories, RECORD_CATEGORY_BADGE } from "../model/category";
import type { RecordSummary } from "../model/types";

export function RecordCategoryBadge({
  category: value,
  className,
}: {
  category: RecordSummary["category"];
  className?: string;
}) {
  return normalizeRecordCategories(value).map((category) => (
    <Badge
      className={cn("shrink-0 rounded-full px-1.5 py-0.5 font-medium", RECORD_CATEGORY_BADGE[category], className)}
      key={category}
    >
      {getRecordCategoryLabel(category)}
    </Badge>
  ));
}
