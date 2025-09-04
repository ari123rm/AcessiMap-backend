// src/controllers/avaliacaoController.js
const avaliacaoService = require('./avaliacao.service');

const create = async (req, res) => {
  try {
    // O id do usuário vem do token (garantido pelo middleware)
    const id_usuario = req.usuario.id;
    // Esperamos que o corpo da requisição seja um array de avaliações
    const avaliacoes = req.body; 
console.log('Dados recebidos para salvar AVALIAÇÕES DE ITENS:', JSON.stringify(avaliacoes, null, 2));
    if (!Array.isArray(avaliacoes) || avaliacoes.length === 0) {
      return res.status(400).json({ message: 'O corpo da requisição deve ser um array de avaliações.' });
    }

    const result = await avaliacaoService.createAvaliacoes(avaliacoes, id_usuario);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getByEst = async (req, res) => {
    try {
        const { id_estabelecimento } = req.params;
        const avaliacoes = await avaliacaoService.getAvaliacoesByEstabelecimento(id_estabelecimento);
        res.status(200).json(avaliacoes);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const remove = async (req, res) => {
  try {
    const deleted = await avaliacaoService.deleteAvaliacao(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'avaliacao não encontrada para deletar' });
    }
    res.status(204).send(); // 204 No Content
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCategoriaAvaliacao = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;
    const avaliacoes = req.body; // Espera um array de { id_estabelecimento, id_categoria, nota }
    if (!Array.isArray(avaliacoes) || avaliacoes.length === 0) {
      return res.status(400).json({ message: 'Corpo da requisição inválido.' });
    }
    const result = await avaliacaoService.createCategoriaAvaliacoes(avaliacoes, id_usuario);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getMinhasAvaliacoes = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;
    const { id_estabelecimento } = req.params;

    const minhasAvaliacoes = await avaliacaoService.findMinhasAvaliacoesPorLugar(id_usuario, id_estabelecimento);
    res.status(200).json(minhasAvaliacoes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { create, getByEst, remove,createCategoriaAvaliacao,getMinhasAvaliacoes };