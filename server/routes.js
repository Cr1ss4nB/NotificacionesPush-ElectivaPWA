// Routes.js - Módulo de rutas
const express = require('express');
const router = express.Router();
const push = require('./push');

const mensajes = [

  {
    _id: 'XXX',
    user: 'spiderman',
    mensaje: 'Hola Mundo'
  }

];


// Get mensajes
router.get('/', function (req, res) {
  // res.json('Obteniendo mensajes');
  res.json( mensajes );
});


// Post mensaje
router.post('/', function (req, res) {
  
  const mensaje = {
    mensaje: req.body.mensaje,
    user: req.body.user
  };

  mensajes.push( mensaje );

  console.log(mensajes);


  res.json({
    ok: true,
    mensaje
  });
});


// Almacenar la suscripción
router.post('/subscribe', (req, res) => {


  const suscripcion = req.body;

  
  push.addSubscription( suscripcion );


  res.json('subscribe');

});

// Almacenar la suscripción
router.get('/key', (req, res) => {

  const key = push.getKey();


  res.send(key);

});


// Envar una notificación PUSH a las personas
// que nosotros queramos
// ES ALGO que se controla del lado del server
router.post('/push', (req, res) => {

  // Se propagan propiedades personalizadas para que el SW las use.
  const post = {
    titulo: req.body.titulo,
    cuerpo: req.body.cuerpo,
    usuario: req.body.usuario,
    url: req.body.url,
    icon: req.body.icon,
    badge: req.body.badge,
    image: req.body.image,
    vibrate: req.body.vibrate,
    tag: req.body.tag,
    renotify: req.body.renotify,
    requireInteraction: req.body.requireInteraction,
    silent: req.body.silent,
    dir: req.body.dir,
    lang: req.body.lang,
    actions: req.body.actions,
    timestamp: req.body.timestamp
  };


  push.sendPush( post );

  res.json( post );

});





module.exports = router;