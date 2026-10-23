const getSubscription = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return null;

  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
};

export const getPushEndpoint = async () => {
  return (await getSubscription())?.endpoint ?? null;
};

/** 이 기기의 구독을 해지하고, 서버에서 지울 endpoint를 돌려준다. 구독이 없으면 null이다. */
export const unsubscribePush = async () => {
  const subscription = await getSubscription();
  if (!subscription) return null;

  const { endpoint } = subscription;
  await subscription.unsubscribe();
  return endpoint;
};
