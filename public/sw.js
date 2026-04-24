// imports
importScripts('https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js');
importScripts('js/sw-db.js');
importScripts('js/sw-utils.js');

const STATIC_CACHE = 'static-v3';
const DYNAMIC_CACHE = 'dynamic-v1';
const INMUTABLE_CACHE = 'inmutable-v1';

const APP_SHELL = [
    '/',
    'index.html',
    'css/style.css',
    'img/favicon.ico',
    'img/avatars/hulk.jpg',
    'img/avatars/ironman.jpg',
    'img/avatars/spiderman.jpg',
    'img/avatars/thor.jpg',
    'img/avatars/wolverine.jpg',
    'img/icons/icon-192x192.png',
    'img/icons/icon-512x512.png',
    'js/app.js',
    'js/sw-db.js',
    'js/sw-utils.js',
    'js/libs/plugins/mdtoast.min.js',
    'js/libs/plugins/mdtoast.min.css'
];

const APP_SHELL_INMUTABLE = [
    'https://fonts.googleapis.com/css?family=Quicksand:300,400',
    'https://fonts.googleapis.com/css?family=Lato:400,300',
    'https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.0/animate.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js',
    'https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js'
];

self.addEventListener('install', e => {

    const cacheStatic = caches.open(STATIC_CACHE)
        .then(cache => cache.addAll(APP_SHELL));

    const cacheInmutable = caches.open(INMUTABLE_CACHE)
        .then(cache => cache.addAll(APP_SHELL_INMUTABLE));

    e.waitUntil(Promise.all([cacheStatic, cacheInmutable]));
});

self.addEventListener('activate', e => {

    const respuesta = caches.keys().then(keys => {

        return Promise.all(
            keys.map(key => {

                if (key !== STATIC_CACHE && key.includes('static')) {
                    return caches.delete(key);
                }

                if (key !== DYNAMIC_CACHE && key.includes('dynamic')) {
                    return caches.delete(key);
                }

                return null;
            })
        );

    });

    e.waitUntil(respuesta);
});

self.addEventListener('fetch', e => {

    let respuesta;

    if (e.request.url.includes('/api')) {

        respuesta = manejoApiMensajes(DYNAMIC_CACHE, e.request);

    } else {

        respuesta = caches.match(e.request).then(res => {

            if (res) {

                actualizaCacheStatico(STATIC_CACHE, e.request, APP_SHELL_INMUTABLE);
                return res;

            } else {

                return fetch(e.request)
                    .then(newRes => actualizaCacheDinamico(DYNAMIC_CACHE, e.request, newRes))
                    .catch(() => {
                        if (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html')) {
                            return caches.match('index.html');
                        }
                    });

            }

        });

    }

    e.respondWith(respuesta);
});


// tareas asíncronas
self.addEventListener('sync', e => {

    console.log('SW: Sync');

    if (e.tag === 'nuevo-post') {
        const respuesta = postearMensajes();
        e.waitUntil(respuesta);
    }

});


// Escuchar PUSH
self.addEventListener('push', e => {

    let data = {
        titulo: 'Nuevo mensaje',
        cuerpo: 'Tienes una nueva notificación',
        usuario: 'spiderman'
    };

    try {
        if (e.data) {
            data = JSON.parse(e.data.text());
        }
    } catch (error) {
        console.log('Error leyendo el payload del push:', error);
    }

    const title = data.titulo || 'Nuevo mensaje';

    const options = {
        body: data.cuerpo || 'Tienes una nueva notificación',
        icon: `img/avatars/${data.usuario || 'spiderman'}.jpg`,
        badge: 'img/favicon.ico',
        image: 'https://vignette.wikia.nocookie.net/marvelcinematicuniverse/images/5/5b/Torre_de_los_Avengers.png/revision/latest?cb=20150626220613&path-prefix=es',
        vibrate: [125, 75, 125, 275, 200, 275, 125, 75, 125],
        requireInteraction: true,
        data: {
            url: '/',
            id: data.usuario || 'spiderman'
        },
        actions: [
            {
                action: 'thor-action',
                title: 'Thor',
                icon: 'img/avatars/thor.jpg'
            },
            {
                action: 'ironman-action',
                title: 'Ironman',
                icon: 'img/avatars/ironman.jpg'
            }
        ]
    };

    e.waitUntil(
        self.registration.showNotification(title, options)
    );
});


// Cierra la notificación
self.addEventListener('notificationclose', e => {
    console.log('Notificación cerrada', e);
});


// Click en la notificación
self.addEventListener('notificationclick', e => {

    const notificacion = e.notification;
    const accion = e.action;
    const url = (notificacion.data && notificacion.data.url) ? notificacion.data.url : '/';

    console.log({ notificacion, accion });

    notificacion.close();

    const respuesta = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then(clientes => {

        for (const cliente of clientes) {
            if ('focus' in cliente) {
                if (cliente.url.includes(url) || cliente.visibilityState === 'visible') {
                    return cliente.focus();
                }
            }
        }

        if (clients.openWindow) {
            return clients.openWindow(url);
        }
    });

    e.waitUntil(respuesta);
});