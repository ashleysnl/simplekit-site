const CACHE_NAME = "retirement-planner-v9";
const APP_SHELL = [
  "./",
  "./index.html",
  "./oas-clawback-calculator.html",
  "./rrif-withdrawal-calculator.html",
  "./cpp-timing-calculator-canada.html",
  "./rrsp-withdrawal-strategy-canada.html",
  "./retirement-tax-calculator-canada.html",
  "./rrif-minimum-withdrawal-calculator.html",
  "./canadian-retirement-income-calculator.html",
  "./404.html",
  "./styles.css",
  "./src/main.js",
  "./app.js",
  "./app.classic.js",
  "./manifest.webmanifest",
  "./icons/favicon.svg",
  "./icons/icon.svg",
  "./icons/mask-icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const request = event.request;
  const destination = request.destination || "";
  const isNavigation = request.mode === "navigate";

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response && response.ok && request.url.startsWith(self.location.origin)) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    } catch {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (isNavigation || destination === "document") {
        const shell = await caches.match("./index.html");
        if (shell) return shell;
      }
      return new Response("Offline", { status: 503, statusText: "Offline" });
    }
  })());
});
