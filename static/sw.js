// Service Worker для кэширования
const CACHE_NAME = 'taxi-cache-v2';
const urlsToCache = [
  '/',
  '/about',
  '/pricing',
  '/contacts',
  '/terms',
  '/privacy',
  '/static/css/style.css',
  '/static/js/main.js',
  '/static/js/calculator.js',
  '/static/img/hero-bg.jpg',
  '/static/img/economy.jpg',
  '/static/img/comfort.jpg',
  '/static/img/business.jpg',
  '/static/img/premium.jpg',
  '/static/img/placeholder.jpg',
  '/static/img/favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем кэшированный ресурс, если он есть
        if (response) {
          return response;
        }
        
        // Иначе выполняем сетевой запрос
        return fetch(event.request).then(response => {
          // Проверяем, валидный ли ответ
          if(!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Клонируем ответ
          const responseToCache = response.clone();
          
          // Кэшируем полученный ресурс
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});