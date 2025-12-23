// 版本号 - 每次更新时手动修改这个版本号（添加时间戳确保更新）
const CACHE_VERSION = 'v2.3-' + Date.now();
const CACHE_NAME = 'rhythm-cascade-' + CACHE_VERSION;
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './pwa-icon.svg'
];

self.addEventListener('install', (event) => {
  // 强制激活新的service worker
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  // 立即控制所有客户端
  event.waitUntil(
    Promise.all([
      // 删除所有旧缓存
      caches.keys().then((keys) => 
        Promise.all(keys.filter((k) => k.startsWith('rhythm-cascade-') && k !== CACHE_NAME).map((k) => caches.delete(k)))
      ),
      // 立即控制所有客户端
      clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  
  // 对于HTML文件和JS文件，总是从网络获取最新版本（禁用缓存）
  if (request.url.includes('index.html') || request.url.includes('.js') || request.destination === 'document') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).then((response) => {
        // 更新缓存
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
        return response;
      }).catch(() => {
        // 如果网络失败，尝试从缓存获取
        return caches.match(request);
      })
    );
    return;
  }
  
  // 其他资源：网络优先，失败时使用缓存
  event.respondWith(
    fetch(request).then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
      return response;
    }).catch(() => {
      return caches.match(request).then((cached) => cached || Response.error());
    })
  );
});
