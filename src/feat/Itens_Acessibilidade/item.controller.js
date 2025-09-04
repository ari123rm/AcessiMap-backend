// src/controllers/ItemController.js
const ItemService = require('./item.service');

const create = async (req, res) => {
  try {
    const Item = await ItemService.createItem(req.body);
    res.status(201).json(Item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const itens = await ItemService.getAllItens();
    res.status(200).json(itens);
  } catch (error) {
    // Este erro aparecerá no seu terminal do backend
    console.error("Erro ao buscar itens de acessibilidade:", error);
    res.status(500).json({ message: "Erro interno ao buscar itens." });
  }
};

const getById = async (req, res) => {
  try {
    const Item = await ItemService.getItemById(req.params.id);
    if (!Item) {
      return res.status(404).json({ message: 'Item não encontrada' });
    }
    res.status(200).json(Item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const updated = await ItemService.updateItem(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Item não encontrada para atualizar' });
    }
    res.status(200).json({ message: 'Item atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const deleted = await ItemService.deleteItem(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Item não encontrada para deletar' });
    }
    res.status(204).send(); // 204 No Content
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { create, getAll, getById, update, remove };