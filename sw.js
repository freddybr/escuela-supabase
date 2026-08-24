const CACHE_NAME = 'escuela-digital-cache-v4';
const ASSETS = [
  './',
  './app.html',
  './index.html',
  './manifest.json',
  './css/app.css',
  './css/landing.css',
  './js/app.js',
  './js/config.js',
  './js/ui.js',
  './js/services.js',
  './js/views/alumnos.js',
  './js/views/asignaciones.js',
  './js/views/asistencias.js',
  './js/views/clases.js',
  './js/views/configuracion.js',
  './js/views/control.js',
  './js/views/grados.js',
  './js/views/materias.js',
  './js/views/periodos.js',
  './js/views/profesores.js',
  './js/views/reportes.js',
  './image/EscuelaIco-32x32.png',
  './image/EscuelaIco-apple.png',
  './image/EscuelaIco-192x192.png',
  './image/EscuelaIco-512x512.png'
];

// Instalar Service Worker y cachear recursos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Cacheando archivos estáticos');
      // Usar addAll de forma tolerante a fallos individuales de red en la instalación
      return Promise.all(
        ASSETS.map(url => {
          return cache.add(url).catch(err => {
            console.warn(`[Service Worker] Falló al cachear recurso: ${url}`, err);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activar Service Worker y limpiar cachés viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Limpiando caché viejo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', event => {
  // Solo procesar peticiones GET locales (no APIs externas como Supabase)
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clonar y guardar en caché la versión más reciente si la petición es exitosa
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, cargar de la caché local
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si no está en caché y es navegación HTML, retornar app.html o index.html
          if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
            if (url.pathname.includes('app.html')) {
              return caches.match('./app.html');
            }
            return caches.match('./index.html');
          }
        });
      })
  );
});
