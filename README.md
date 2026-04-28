# Notas:

Este es un pequeño servidor de express listo para ejecutarse y servir la carpeta public en la web.

Recuerden que deben de reconstruir los módulos de node con el comando

```
npm install
```

Luego, para correr en producción
```
npm start
```

Para correr en desarrollo
```
npm run dev
```

## Evidencias y verificacion de puntos

### 1) Llaves VAPID (correo institucional)

- Archivos actualizados:
	- server/vapid.json (publicKey/privateKey)
	- server/push.js (mailto)
- Captura sugerida:
	- Abrir server/vapid.json y server/push.js mostrando las claves y el correo.

### 2) Indicador de estado de permisos (Denied/Default/Granted)

- Se agrego un indicador visual en la esquina superior derecha del header.
- Elementos y estilos:
	- public/index.html: span#permiso-estado
	- public/css/style.css: clases .permiso-estado, .permiso-granted, .permiso-denied, .permiso-default
- Logica:
	- public/js/app.js: funciones actualizarEstadoPermiso() e inicializarEstadoPermiso()
	- Se sincroniza el estado con Notification.permission y navigator.permissions.
- Verificacion:
	- Abrir la app y observar el texto Default.
	- Al permitir o bloquear notificaciones, el indicador cambia a Granted o Denied.

### 3) Notificaciones push personalizadas (propiedades extra)

- Se ampliaron las propiedades enviadas en el payload (url, icon, badge, image, vibrate, tag, renotify, requireInteraction, silent, dir, lang, actions, timestamp).
- Cambios:
	- server/routes.js: extiende el payload del endpoint POST /api/push
	- public/sw.js: aplica propiedades adicionales al mostrar la notificacion
	- public/js/app.js: helper window.enviarPushPersonalizada()
- Verificacion (despues de suscribirse):
	- En consola del navegador ejecutar:
		window.enviarPushPersonalizada()
	- Tomar captura del codigo (app.js, sw.js, routes.js) y de la notificacion mostrada.

### 4) Prueba en Google Chrome y correcciones

- Se corrigieron rutas de iconos de acciones para Chrome (img/avatars/...)
- Se agrego tolerancia si el payload llega vacio o con JSON invalido.
- Recomendacion:
	- Usar https o http://localhost
	- Asegurar permisos de notificacion en Chrome
	- Revisar Application > Service Workers y Push en DevTools si hay fallos
