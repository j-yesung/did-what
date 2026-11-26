import {
  AirplaneTiltIcon,
  CakeIcon,
  CoffeeIcon,
  HeartIcon,
  NotePencilIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";

import type { RecordCategory } from "../model/options/category";

export const RECORD_CATEGORY_ICON: Record<RecordCategory, { Icon: typeof HeartIcon; color: string }> = {
  celebration: { Icon: CakeIcon, color: "text-category-anniversary" },
  daily: { Icon: CoffeeIcon, color: "text-category-daily" },
  date: { Icon: HeartIcon, color: "text-category-date" },
  gathering: { Icon: UsersThreeIcon, color: "text-category-gathering" },
  travel: { Icon: AirplaneTiltIcon, color: "text-category-travel" },
  uncategorized: { Icon: NotePencilIcon, color: "text-category-uncategorized" },
};
