/** 아이콘은 variant가 정한다. 부르는 쪽은 무엇을 알릴지만 넘긴다. */
export type Toast = {
  description?: string;
  title: string;
  variant: "error" | "success" | "warning";
};

type ToastListener = (toast: Toast) => void;

const listeners = new Set<ToastListener>();

export const showToast = (toast: Toast) => {
  for (const listener of listeners) listener(toast);
};

export const subscribeToast = (listener: ToastListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
