// src/feat/Rankings/ranking.routes.js
const express = require('express');
const router = express.Router();
const rankingController = require('./ranking.controller');

router.get('/', rankingController.get);

module.exports = router;