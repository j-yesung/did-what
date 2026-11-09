import { cookies } from "next/headers";

import { parseTheme, THEME_COOKIE } from "../model/theme";

export const getTheme = async () => {
  const store = await cookies();
  return parseTheme(store.get(THEME_COOKIE)?.value);
};
