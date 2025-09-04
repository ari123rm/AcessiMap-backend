// src/controllers/estController.js
const estService = require('./estabelecimento.service');

async function getEstabelecimentoDetails(req, res) {
  try {
    const { google_place_id } = req.params;
    const ranking = await estService.getRankingByPlaceId(google_place_id);

    if (!ranking) {
      return res.status(404).json({ message: 'Estabelecimento não encontrado em nossa base de dados.' });
    }

    res.status(200).json(ranking);
  } catch (error) {
    console.error('Erro ao buscar detalhes do estabelecimento:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
}

const findInMap = async (req, res) => {
  try {
    // Os parâmetros virão da query string da URL, ex: ?swLat=...&swLng=...
    const bounds = req.query; 
    const estabelecimentos = await estService.findInMapBounds(bounds);
    res.status(200).json(estabelecimentos);
  } catch (error) {
    console.error("Erro ao buscar estabelecimentos no mapa:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEstabelecimentoDetails,
  findInMap,
};