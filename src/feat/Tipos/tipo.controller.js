const tipoService = require('./tipo.service');

const getAll = async (req, res) => {
  try {
    const tipos = await tipoService.getAllTipos();
    res.status(200).json(tipos);
  } catch (error) {
    console.error("Erro ao buscar tipos:", error);
    res.status(500).json({ message: "Erro interno ao buscar tipos." });
  }
};

module.exports = {
  getAll,
};