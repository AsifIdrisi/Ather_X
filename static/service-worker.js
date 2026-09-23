/* WeatherGPT - True Background Push Service Worker */
self.addEventListener("push", event => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (_) {
        data = { body: event.data ? event.data.text() : "An important weather update is available." };
    }

    const title = data.title || "WeatherGPT";
    const options = {
        body: data.body || "An important weather update is available.",
        tag: data.tag || "weathergpt-alert",
        renotify: true,
        data: { url: data.url || "/" }
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
    event.notification.close();
    const target = event.notification.data?.url || "/";
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
            for (const client of list) {
                if ("focus" in client) {
                    client.focus();
                    return client.navigate ? client.navigate(target) : undefined;
                }
            }
            return clients.openWindow(target);
        })
    );
});
