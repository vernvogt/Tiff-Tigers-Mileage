// Bump this whenever index.html, its CSS/JS, icons, or manifest change.
// Bumping the version is what makes the installed app pick up a new shell.
const SHELL_CACHE = 'tiffs-tigers-shell-v1';

const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // data.json: always try the network first so mileage updates show up
  // the moment they're published, but fall back to the last cached copy
  // if the phone is offline (e.g. no signal on the water).
  if (url.pathname.endsWith('/data.json')) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, copy));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else (the app shell): cache-first so the installed app
  // opens instantly and works offline, refreshed only when SHELL_CACHE
  // is bumped to a new version.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
