// src/routes/itemRoutes.js
const express = require('express');
const router = express.Router();
const itemController = require('./item.controller');

router.post('/', itemController.create);
router.get('/', itemController.getAll);
router.get('/:id', itemController.getById);
router.put('/:id', itemController.update);
router.delete('/:id', itemController.remove);

module.exports = router;