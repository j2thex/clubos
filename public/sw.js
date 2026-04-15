/* ClubOS service worker — web push */

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
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
