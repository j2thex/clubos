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
  const rawUrl = (event.notification.data && event.notification.data.url) || "/";
  // Resolve against the SW scope so relative paths become absolute same-origin URLs.
  let target;
  try {
    target = new URL(rawUrl, self.registration.scope).href;
  } catch {
    target = self.registration.scope;
  }
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const sameOrigin = allClients.filter((c) => {
        try {
          return new URL(c.url).origin === new URL(target).origin;
        } catch {
          return false;
        }
      });
      if (sameOrigin.length > 0) {
        const client = sameOrigin[0];
        try {
          if ("navigate" in client) {
            await client.navigate(target);
          }
        } catch {
          // navigate can throw if the client is cross-origin or in a bad state;
          // fall through to focus so the user at least sees the PWA.
        }
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow(target);
    })(),
  );
});
