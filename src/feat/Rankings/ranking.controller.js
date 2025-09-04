// src/feat/Rankings/ranking.controller.js
const rankingService = require('./ranking.service');

const get = async (req, res) => {
  try {
    // Pega os filtros da query string da URL (ex: /api/rankings?sortBy=1&filterByType=5)
    const { sortBy, filterByType } = req.query;
    const rankings = await rankingService.getRankings({ sortBy, filterByType });
    res.status(200).json(rankings);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar rankings.' });
  }
};

module.exports = { get };

