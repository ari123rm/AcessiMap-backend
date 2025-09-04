// src/routes/categoriaRoutes.js
const express = require('express');
const router = express.Router();
const avaliacaoController = require('./avaliacao.controller');
const authMiddleware = require('../../middleware/auth'); // Importa o middleware

router.post('/',  authMiddleware,avaliacaoController.create);
router.get('/:id', avaliacaoController.getByEst);
router.delete('/:id',  authMiddleware,avaliacaoController.remove);
router.post('/categorias', authMiddleware, avaliacaoController.createCategoriaAvaliacao);
router.get('/me/:id_estabelecimento', authMiddleware, avaliacaoController.getMinhasAvaliacoes);

module.exports = router;