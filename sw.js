/* Service worker de BAJA (21/08).
 *
 * Segundo camino de apagado, independiente del de la pagina. El navegador
 * revisa sw.js cada tanto y, si cambio un solo byte, instala el nuevo. Este
 * borra todos los caches y se desregistra solo. Sirve para el equipo que tenga
 * el service worker viejo activo aunque no llegue a ejecutar el script de la
 * pagina.
 *
 * Mientras tanto NO responde ningun pedido: todo va a la red. Si no hay red, el
 * telefono muestra el error del navegador en vez de la app cacheada, que es
 * justamente lo que se busca.
 */
self.addEventListener('install', function () { self.skipWaiting(); });

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
      /* OJO con el orden: primero se recargan las pestañas abiertas y RECIEN
         DESPUES se desregistra. Al reves, el service worker ya no controla a los
         clientes y c.navigate() no hace nada: el que estaba con la app abierta
         se quedaba adentro. */
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (cs) { cs.forEach(function (c) { try { c.navigate(c.url); } catch (e) {} }); })
      .then(function () { return self.registration.unregister(); })
      .catch(function () {})
  );
});

/* sin handler de fetch: todo pasa derecho a la red */
