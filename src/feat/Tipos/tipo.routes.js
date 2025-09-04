const express = require('express');
const router = express.Router();
const tipoController = require('./tipo.controller');

// Rota para buscar todos os tipos
router.get('/', tipoController.getAll);

module.exports = router;