"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { parseTheme, THEME_COOKIE } from "../model/theme";

const ONE_YEAR = 60 * 60 * 24 * 365;

export const setTheme = async (formData: FormData) => {
  const theme = parseTheme(String(formData.get("theme") ?? ""));
  const store = await cookies();

  store.set(THEME_COOKIE, theme, {
    httpOnly: false,
    maxAge: ONE_YEAR,
    path: "/",
    sameSite: "lax",
  });

  // 모드는 최상위 레이아웃의 클래스라 모든 화면을 다시 그린다.
  revalidatePath("/", "layout");
};
