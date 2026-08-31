import type { ForwardRefExoticComponent, RefAttributes } from "react";

export type NoticeIconHandle = { startAnimation: () => void; stopAnimation: () => void };
export type NoticeIcon = ForwardRefExoticComponent<
  {
    duration?: number;
    size?: number;
  } & RefAttributes<NoticeIconHandle>
>;

type NoticeBase = { description?: string; title: string };

export type Notice =
  | (NoticeBase & { icon: NoticeIcon; variant: "success" })
  | (NoticeBase & { icon?: never; variant: "error" | "warning" });

type NoticeListener = (notice: Notice) => void;

const listeners = new Set<NoticeListener>();

export function showNotice(notice: Notice) {
  for (const listener of listeners) listener(notice);
}

export function subscribeNotice(listener: NoticeListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
