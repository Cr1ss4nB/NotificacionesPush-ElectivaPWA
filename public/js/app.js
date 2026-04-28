var url = window.location.href;
var swLocation = '/sw.js';

var swReg;
window.enviarNotificacion = enviarNotificacion;

if ( navigator.serviceWorker ) {


    if ( url.includes('localhost') ) {
        swLocation = '/sw.js';
    }


    window.addEventListener('load', function() {

        navigator.serviceWorker.register( swLocation ).then( function(reg){

            swReg = reg;
            swReg.pushManager.getSubscription().then( actualizarUIEstadoNotificaciones );

        });

    });

}





// Referencias de jQuery

var titulo      = $('#titulo');
var nuevoBtn    = $('#nuevo-btn');
var salirBtn    = $('#salir-btn');
var cancelarBtn = $('#cancel-btn');
var postBtn     = $('#post-btn');
var avatarSel   = $('#seleccion');
var timeline    = $('#timeline');

var modal       = $('#modal');
var modalAvatar = $('#modal-avatar');
var avatarBtns  = $('.seleccion-avatar');
var txtMensaje  = $('#txtMensaje');
var permisoEstado = $('#permiso-estado');

var btnActivadas    = $('.btn-noti-activadas');
var btnDesactivadas = $('.btn-noti-desactivadas');

// El usuario, contiene el ID del hÃ©roe seleccionado
var usuario;




// ===== Codigo de la aplicación

function crearMensajeHTML(mensaje, personaje) {

    var content =`
    <li class="animated fadeIn fast">
        <div class="avatar">
            <img src="img/avatars/${ personaje }.jpg">
        </div>
        <div class="bubble-container">
            <div class="bubble">
                <h3>@${ personaje }</h3>
                <br/>
                ${ mensaje }
            </div>
            
            <div class="arrow"></div>
        </div>
    </li>
    `;

    timeline.prepend(content);
    cancelarBtn.click();

}



// Globals
function logIn( ingreso ) {

    if ( ingreso ) {
        nuevoBtn.removeClass('oculto');
        salirBtn.removeClass('oculto');
        timeline.removeClass('oculto');
        avatarSel.addClass('oculto');
        modalAvatar.attr('src', 'img/avatars/' + usuario + '.jpg');
    } else {
        nuevoBtn.addClass('oculto');
        salirBtn.addClass('oculto');
        timeline.addClass('oculto');
        avatarSel.removeClass('oculto');

        titulo.text('Seleccione Personaje');
    
    }

}


// Seleccion de personaje
avatarBtns.on('click', function() {

    usuario = $(this).data('user');

    titulo.text('@' + usuario);

    logIn(true);

});

// Boton de salir
salirBtn.on('click', function() {

    logIn(false);

});

// Boton de nuevo mensaje
nuevoBtn.on('click', function() {

    modal.removeClass('oculto');
    modal.animate({ 
        marginTop: '-=1000px',
        opacity: 1
    }, 200 );

});


// Boton de cancelar mensaje
cancelarBtn.on('click', function() {
    if ( !modal.hasClass('oculto') ) {
        modal.animate({ 
            marginTop: '+=1000px',
            opacity: 0
         }, 200, function() {
             modal.addClass('oculto');
             txtMensaje.val('');
         });
    }
});

// Boton de enviar mensaje
postBtn.on('click', function() {

    var mensaje = txtMensaje.val();
    if ( mensaje.length === 0 ) {
        cancelarBtn.click();
        return;
    }

    var data = {
        mensaje: mensaje,
        user: usuario
    };


    fetch('api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( data )
    })
    .then( res => res.json() )
    .then( res => console.log( 'app.js', res ))
    .catch( err => console.log( 'app.js error:', err ));



    crearMensajeHTML( mensaje, usuario );

});



// Obtener mensajes del servidor
function getMensajes() {

    fetch('api')
        .then( res => res.json() )
        .then( posts => {

            console.log(posts);
            posts.forEach( post =>
                crearMensajeHTML( post.mensaje, post.user ));


        });


}

getMensajes();



// Detectar cambios de conexión
function isOnline() {

    if ( navigator.onLine ) {
        $.mdtoast('Online', {
            interaction: true,
            interactionTimeout: 1000,
            actionText: 'OK!'
        });


    } else{
        // No tenemos conexión
        $.mdtoast('Offline', {
            interaction: true,
            actionText: 'OK',
            type: 'warning'
        });
    }

}

window.addEventListener('online', isOnline );
window.addEventListener('offline', isOnline );

isOnline();
inicializarEstadoPermiso();
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        refrescarEstadoNotificaciones();
    }
});


// Notificaciones
// Sincroniza el texto y color del indicador con el permiso actual.
function actualizarEstadoPermiso(estado) {
    var permiso = estado;

    if (permiso === 'prompt') {
        permiso = 'default';
    }

    permisoEstado
        .removeClass('permiso-granted permiso-denied permiso-default')
        .addClass('permiso-' + permiso)
        .text(permiso.charAt(0).toUpperCase() + permiso.slice(1));
}

function inicializarEstadoPermiso() {
    if (!('Notification' in window)) {
        actualizarEstadoPermiso('default');
        return;
    }

    // Estado inicial al cargar la app.
    actualizarEstadoPermiso(Notification.permission);

    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'notifications' }).then(function(status) {
            actualizarEstadoPermiso(status.state);
            status.onchange = function() {
                actualizarEstadoPermiso(status.state);
                refrescarEstadoNotificaciones();
            };
        }).catch(function() {
            actualizarEstadoPermiso(Notification.permission);
        });
    }
}

function actualizarUIEstadoNotificaciones(suscripcion) {
    if (!('Notification' in window)) {
        btnActivadas.addClass('oculto');
        btnDesactivadas.addClass('oculto');
        return;
    }

    actualizarEstadoPermiso(Notification.permission);

    if (Notification.permission !== 'granted' || !suscripcion) {
        btnActivadas.addClass('oculto');
        btnDesactivadas.removeClass('oculto');
        return;
    }

    btnActivadas.removeClass('oculto');
    btnDesactivadas.addClass('oculto');
}

function refrescarEstadoNotificaciones() {
    if (!swReg || !swReg.pushManager) {
        actualizarUIEstadoNotificaciones(null);
        return;
    }

    swReg.pushManager.getSubscription().then(actualizarUIEstadoNotificaciones);
}



async function enviarNotificacion() {

    if (!swReg) {
        console.log('No hay registro de Service Worker');
        return;
    }
     if (!('Notification' in window)) {
        console.log('Este navegador no soporta notificaciones');
        return;
    }

    if (Notification.permission !== 'granted') {
        console.log('No hay permiso para mostrar notificaciones');
        return;
    }
    try {
        console.log('Mostrando notificación de prueba...');
        await swReg.showNotification('Notificación de prueba', {
            body: 'Las notificaciones funcionan correctamente en Chrome',
            icon: 'img/icons/icon-192x192.png',
            badge: 'img/favicon.ico',
            data: {
                url: '/index.html'
            },
            requireInteraction: true
        });
    } catch (err) {
        console.log('Error mostrando notificación de prueba:', err);
    }

}

async function solicitarPermisoNotificaciones() {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('El permiso para las notificaciones se ha concedido!');
        actualizarEstadoPermiso('granted');
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('El usuario bloqueó las notificaciones');
        actualizarEstadoPermiso('denied');
    return false;
  }

  const permiso = await Notification.requestPermission();
    actualizarEstadoPermiso(permiso);
  return permiso === 'granted';
}



// Get Key
function getPublicKey() {
    return fetch('api/key')
        .then( res => res.arrayBuffer())
        // returnar arreglo, pero como un Uint8array
        .then( key => new Uint8Array(key) );


}

btnDesactivadas.on('click', async function() {

    try {
        if (!swReg) {
            console.log('No hay registro de SW');
            return;
        }

        const permitido = await solicitarPermisoNotificaciones();

        if (!permitido) {
            console.log('El usuario no concedió permisos');
            return;
        }

        const key = await getPublicKey();

        const subscription = await swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: key
        });

        await fetch('api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });

        actualizarUIEstadoNotificaciones(subscription);

    } catch (err) {
        console.error('Error al activar notificaciones push:', err);
    }

});

// Helper manual para probar payloads personalizados desde consola.
async function enviarPushPersonalizada() {
    const payload = {
        titulo: 'Alerta Stark Industries',
        cuerpo: 'Sistema en linea. Verifique el tablero de control.',
        usuario: 'ironman',
        url: '/index.html',
        icon: 'img/avatars/ironman.jpg',
        badge: 'img/favicon.ico',
        image: 'https://giphy.com/gifs/robert-downey-jr-marvel-iron-man-lXo8uSnIkaB9e',
        vibrate: [120, 80, 140, 80, 180],
        tag: 'stark-alert',
        renotify: true,
        requireInteraction: true,
        silent: false,
        dir: 'ltr',
        lang: 'es-CO',
        actions: [
            {
                action: 'ver-panel',
                title: 'Ver Panel',
                icon: 'img/avatars/ironman.jpg'
            },
            {
                action: 'ignorar',
                title: 'Ignorar',
                icon: 'img/avatars/hulk.jpg'
            }
        ]
    };

    return fetch('api/push', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
}

window.enviarPushPersonalizada = enviarPushPersonalizada;


function cancelarSuscripcion() {

    swReg.pushManager.getSubscription().then( subs => {

        if (!subs) {
            actualizarUIEstadoNotificaciones(null);
            return;
        }

        subs.unsubscribe().then( () =>  actualizarUIEstadoNotificaciones(null) );

    });


}

btnActivadas.on( 'click', function() {

    cancelarSuscripcion();


});
