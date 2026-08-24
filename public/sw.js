/**
 * 푸시 알림 전용 서비스 워커
 * 오프라인 캐싱은 하지 않는다.
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "뭐했지", {
      body: payload.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url ?? "/" },
      tag: payload.tag,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
      const opened = windows.find((client) => "focus" in client);

      /* 이미 앱이 떠 있으면 그 창을 재사용한다. navigate는 iOS에서 없을 수 있어 실패해도 무시한다. */
      if (opened) {
        await opened.focus();
        await opened.navigate?.(url).catch(() => {});
        return;
      }

      await self.clients.openWindow(url);
    })(),
  );
});
