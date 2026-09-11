import { isPushSupported } from "./subscribe-push";

export const disablePush = async () => {
  if (!isPushSupported()) return null;

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return null;

  const { endpoint } = subscription;
  await subscription.unsubscribe();

  return endpoint;
};
