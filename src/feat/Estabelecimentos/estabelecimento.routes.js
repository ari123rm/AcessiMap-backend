// src/routes/estRoutes.js
const express = require('express');
const router = express.Router();
const estController = require('./estabelecimento.controller');

// GET /api/estabelecimentos/ChIJN1t_tDeuEmsRUsoyG83frY4
router.get('/map-search', estController.findInMap);
router.get('/:google_place_id', estController.getEstabelecimentoDetails);

module.exports = router;