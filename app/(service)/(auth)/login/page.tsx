import type { Metadata } from "next";

/** 화면 안 제목을 뺐으므로 어떤 화면인지는 탭 제목이 알린다. */
export const metadata: Metadata = { title: "로그인 · 뭐했지" };

export { LoginPage as default } from "@/pages/auth";
