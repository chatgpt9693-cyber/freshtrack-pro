// FreshTrack Service Worker
const CACHE_NAME = 'freshtrack-v1';
const urlsToCache = [
  '/',
  '/scanner',
  '/products',
  '/batches',
  '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Возвращаем кешированную версию или загружаем из сети
        return response || fetch(event.request);
      })
  );
});

// Обработка Share Target API
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHARE_TARGET') {
    // Обрабатываем данные, полученные через Web Share Target
    const { title, text, url } = event.data;
    
    // Если это штрихкод, перенаправляем на сканер
    if (text && /^[0-9]{8,13}$/.test(text)) {
      event.ports[0].postMessage({
        type: 'BARCODE_RECEIVED',
        barcode: text
      });
    }
  }
});

// Обработка background sync для офлайн режима
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Синхронизация данных при восстановлении соединения
  console.log('Background sync triggered');
}