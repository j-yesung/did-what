import type { Theme } from "@/features/switch-theme/model/theme";

import { toSafeAppPath } from "./demo-href.ts";

/**
 * 체험 페이지(부모)와 가운데 앱(iframe)이 주고받는 메시지.
 * 받는 쪽은 출처·보낸 창·종류·값을 모두 확인하고, 정해진 명령만 실행한다.
 */
export const DEMO_MESSAGE_SOURCE = "did-what-demo";

export type DemoCommand =
  | { name: "addRecord" }
  | { name: "navigate"; path: string }
  | { name: "receiveNotification" }
  | { name: "setTheme"; theme: Theme }
  | { name: "switchMember"; memberId: string };

export type DemoSnapshot = {
  changed: boolean;
  currentMemberId: string | null;
  members: { id: string; name: string }[];
  path: string;
  theme: Theme;
};

export type DemoAppMessage =
  | { message: string; tone: "success" | "warning"; type: "feedback" }
  | { state: DemoSnapshot; type: "state" };

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const THEMES = new Set(["dark", "light", "system"]);

export const toCommandMessage = (command: DemoCommand) => ({ command, source: DEMO_MESSAGE_SOURCE, type: "command" });

export const toAppMessage = (message: DemoAppMessage) => ({ ...message, source: DEMO_MESSAGE_SOURCE });

/** 부모가 보낸 명령을 읽는다. 모르는 명령이나 값이 섞이면 null이다. */
export const readDemoCommand = (data: unknown): DemoCommand | null => {
  if (!isObject(data) || data.source !== DEMO_MESSAGE_SOURCE || data.type !== "command") return null;
  const command = data.command;
  if (!isObject(command) || typeof command.name !== "string") return null;

  if (command.name === "addRecord" || command.name === "receiveNotification") return { name: command.name };
  if (command.name === "navigate" && typeof command.path === "string") {
    return { name: "navigate", path: toSafeAppPath(command.path) };
  }
  if (command.name === "switchMember" && typeof command.memberId === "string") {
    return { memberId: command.memberId, name: "switchMember" };
  }
  if (command.name === "setTheme" && THEMES.has(command.theme as string)) {
    return { name: "setTheme", theme: command.theme as Theme };
  }
  return null;
};

/** 앱이 보낸 상태·결과 메시지를 읽는다. */
export const readDemoAppMessage = (data: unknown): DemoAppMessage | null => {
  if (!isObject(data) || data.source !== DEMO_MESSAGE_SOURCE) return null;
  if (
    data.type === "feedback" &&
    typeof data.message === "string" &&
    (data.tone === "success" || data.tone === "warning")
  ) {
    return { message: data.message, tone: data.tone, type: "feedback" };
  }
  if (data.type === "state" && isObject(data.state) && typeof data.state.path === "string") {
    return { state: data.state as DemoSnapshot, type: "state" };
  }
  return null;
};
