const express = require('express');
const router = express.Router();
const usuarioController = require('./usuario.controller');

// Rota pública para registrar um novo usuário
router.post('/register', usuarioController.register);

// Rota pública para fazer login
router.post('/login', usuarioController.login);

router.post('/verify-email', usuarioController.verify);

module.exports = router;