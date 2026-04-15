/* ClubOS service worker — web push (v3 2026-04-15) */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Notification", body: event.data.text() };
  }
  const { title, body, url, icon, badge, tag } = payload;
  event.waitUntil(
    self.registration.showNotification(title || "Notification", {
      body: body || "",
      icon: icon || "/logo-192.png",
      badge: badge || "/logo-192.png",
      data: { url: url || "/" },
      tag: tag || "clubos-notification",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawUrl =
    (event.notification.data && event.notification.data.url) || "/";
  let target;
  try {
    target = new URL(rawUrl, self.registration.scope).href;
  } catch {
    target = self.registration.scope;
  }
  event.waitUntil(self.clients.openWindow(target));
});
