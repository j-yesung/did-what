import { cookies } from "next/headers";

import { parseTheme, THEME_COOKIE } from "../model/theme";

// 서버에서 현재 화면 모드를 읽는다. 첫 렌더에 클래스를 붙여 깜빡임을 없앤다.
export async function getTheme() {
  const store = await cookies();

  return parseTheme(store.get(THEME_COOKIE)?.value);
}
