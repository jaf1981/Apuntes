/* Service worker de Apuntes.
 *
 * Antes no habia ninguno: la app funcionaba sin conexion de casualidad, porque
 * todo vivia dentro de un unico HTML y el navegador lo cacheaba solo. Al sacar
 * el arte a archivos sueltos (20/08) esa casualidad deja de alcanzar, y hay que
 * declarar explicitamente que se guarda.
 *
 * Dos estrategias distintas y el motivo de cada una:
 *  - El HTML va por RED PRIMERO. Si contestara desde el cache, el chico se
 *    quedaria clavado en una version vieja y romperiamos la actualizacion
 *    automatica, que justamente pide la pagina con ?vchk= para comparar sellos.
 *  - Las imagenes van por CACHE PRIMERO. Cada archivo es inmutable: si cambia
 *    el dibujo cambia el nombre o la version del cache. Asi una publicacion
 *    nueva no obliga a bajar de nuevo 268 KB de arte que no cambio.
 */
var VERSION = '22/08 18:00';
var CACHE = 'apuntes-' + VERSION;

var ESENCIALES = ['./', './index.html', './manifest.json',
                  './icon-192.png', './icon-512.png', './imagenes/sprite.png',
                  './imagenes/avatar/accjin_a_gamer.png',
                  './imagenes/avatar/accjin_a_inear.png',
                  './imagenes/avatar/accjin_a_vincha.png',
                  './imagenes/avatar/accjin_b_roja.png',
                  './imagenes/avatar/accjin_g_lana.png',
                  './imagenes/avatar/accjin_g_negra.png',
                  './imagenes/avatar/accjin_g_visera.png',
                  './imagenes/avatar/accjin_w_digital.png',
                  './imagenes/avatar/accjinf_g_lana.png',
                  './imagenes/avatar/accjinf_g_negra.png',
                  './imagenes/avatar/accjinf_g_visera.png',
                  './imagenes/avatar/accpie_a_gamer.png',
                  './imagenes/avatar/accpie_a_inear.png',
                  './imagenes/avatar/accpie_a_vincha.png',
                  './imagenes/avatar/accpie_b_roja.png',
                  './imagenes/avatar/accpie_g_lana.png',
                  './imagenes/avatar/accpie_g_negra.png',
                  './imagenes/avatar/accpie_g_visera.png',
                  './imagenes/avatar/accpie_w_digital.png',
                  './imagenes/avatar/accpief_g_lana.png',
                  './imagenes/avatar/accpief_g_negra.png',
                  './imagenes/avatar/accpief_g_visera.png',
                  './imagenes/avatar/cabjin_p_colita.png',
                  './imagenes/avatar/cabjin_p_cresta.png',
                  './imagenes/avatar/cabjin_p_rapado.png',
                  './imagenes/avatar/cabjin_p_rulos.png',
                  './imagenes/avatar/cabjinf_p_colita.png',
                  './imagenes/avatar/cabjinf_p_cresta.png',
                  './imagenes/avatar/cabjinf_p_rapado.png',
                  './imagenes/avatar/cabjinf_p_rulos.png',
                  './imagenes/avatar/cabpie_p_colita.png',
                  './imagenes/avatar/cabpie_p_cresta.png',
                  './imagenes/avatar/cabpie_p_rapado.png',
                  './imagenes/avatar/cabpie_p_rulos.png',
                  './imagenes/avatar/cabpief_p_colita.png',
                  './imagenes/avatar/cabpief_p_cresta.png',
                  './imagenes/avatar/cabpief_p_rapado.png',
                  './imagenes/avatar/cabpief_p_rulos.png',
                  './imagenes/avatar/jin_r_basica.png',
                  './imagenes/avatar/jin_r_buzo.png',
                  './imagenes/avatar/jin_r_canguro.png',
                  './imagenes/avatar/jin_r_cuero.png',
                  './imagenes/avatar/jin_r_futbol.png',
                  './imagenes/avatar/jin_r_hawaiana.png',
                  './imagenes/avatar/jin_r_puffer.png',
                  './imagenes/avatar/jinf_r_basica.png',
                  './imagenes/avatar/jinf_r_buzo.png',
                  './imagenes/avatar/jinf_r_canguro.png',
                  './imagenes/avatar/jinf_r_cuero.png',
                  './imagenes/avatar/jinf_r_futbol.png',
                  './imagenes/avatar/jinf_r_hawaiana.png',
                  './imagenes/avatar/jinf_r_puffer.png',
                  './imagenes/avatar/pie_r_basica.png',
                  './imagenes/avatar/pie_r_buzo.png',
                  './imagenes/avatar/pie_r_canguro.png',
                  './imagenes/avatar/pie_r_cuero.png',
                  './imagenes/avatar/pie_r_futbol.png',
                  './imagenes/avatar/pie_r_hawaiana.png',
                  './imagenes/avatar/pie_r_puffer.png',
                  './imagenes/avatar/pief_r_basica.png',
                  './imagenes/avatar/pief_r_buzo.png',
                  './imagenes/avatar/pief_r_canguro.png',
                  './imagenes/avatar/pief_r_cuero.png',
                  './imagenes/avatar/pief_r_futbol.png',
                  './imagenes/avatar/pief_r_hawaiana.png',
                  './imagenes/avatar/pief_r_puffer.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    /* addAll falla entero si un solo archivo falla; se agregan de a uno para
       que un 404 suelto no deje la app sin cache. */
    return Promise.all(ESENCIALES.map(function (u) {
      return c.add(u).catch(function () {});
    }));
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) {
      return k.indexOf('apuntes-') === 0 && k !== CACHE ? caches.delete(k) : null;
    }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;   /* la medicion no se toca */

  /* bloqueos.json NUNCA pasa por el cache. Si el service worker devolviera la
     copia guardada, la app leeria su cabecera Date vieja y la tomaria como "hora
     del servidor": con eso, sin conexion, el reloj de referencia queda plantado en
     el momento en que se cacheo y se dispara el cierre por reloj raro a cualquiera.
     Detectado el 21/08 probando el caso "fuera de la ventana, sin conexion".
     Sin respondWith, el pedido va derecho a la red y falla limpio si no hay. */
  if (/\/bloqueos\.json$/i.test(url.pathname)) return;

  var esImagen = /\.(png|jpg|jpeg|webp|svg)$/i.test(url.pathname);

  if (esImagen) {
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          if (res && res.ok) c.put(req, res.clone());
          return res;
        });
      });
    }));
    return;
  }

  /* HTML y todo lo demas: red primero, cache como red de seguridad */
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok && url.search.indexOf('vchk') === -1) {
      var copia = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copia); });
    }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) {
      return hit || caches.match('./index.html');
    });
  }));
});
