import type { ReactNode } from "react";

import { DemoAppProvider } from "@demo/ui/demo-runtime";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false }, title: "체험용 데모 · 뭐했지" };

export default function Layout({ children }: { children: ReactNode }) {
  return <DemoAppProvider>{children}</DemoAppProvider>;
}
