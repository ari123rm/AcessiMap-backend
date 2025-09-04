// src/controllers/categoriaController.js
const categoriaService = require('./categoria.service');

const create = async (req, res) => {
  try {
    const categoria = await categoriaService.createCategoria(req.body);
    res.status(201).json(categoria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const categorias = await categoriaService.getAllCategorias();
    res.status(200).json(categorias);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const categoria = await categoriaService.getCategoriaById(req.params.id);
    if (!categoria) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }
    res.status(200).json(categoria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const updated = await categoriaService.updateCategoria(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Categoria não encontrada para atualizar' });
    }
    res.status(200).json({ message: 'Categoria atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const deleted = await categoriaService.deleteCategoria(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Categoria não encontrada para deletar' });
    }
    res.status(204).send(); // 204 No Content
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { create, getAll, getById, update, remove };