// routes/chat.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth'); // ojo al path

// GET /chat
router.get('/chat', isAuthenticated, (req, res) => {
  // aquí mandamos el usuario que está en sesión para mostrar el nombre en el chat
  res.render('chat/index', {
    title: 'Chat en tiempo real',
    user: req.session.user
  });
});

module.exports = router;
