const express = require('express');
const router = express.Router();
const comentarioController = require('./comentario.controller');
const authMiddleware = require('../../middleware/auth');

// Rota para postar um novo comentário (protegida)
router.post('/', authMiddleware, comentarioController.create);

module.exports = router;