export type PushActionState = {
  message?: string;
  status: "error" | "success";
};

export type PushSubscriptionInput = {
  auth: string;
  endpoint: string;
  p256dh: string;
};
