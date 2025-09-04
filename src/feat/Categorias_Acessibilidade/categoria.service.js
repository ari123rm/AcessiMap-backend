// src/services/categoriaService.js
const pool = require('../../config/db');

async function createCategoria({ nome }) {
  const [result] = await pool.execute(
    'INSERT INTO Categorias_Acessibilidade (nome) VALUES (?)',
    [nome]
  );
  return { id: result.insertId, nome };
}

async function getAllCategorias() {
  const [rows] = await pool.execute('SELECT * FROM Categorias_Acessibilidade ORDER BY nome');
  return rows;
}

async function getCategoriaById(id) {
  const [rows] = await pool.execute('SELECT * FROM Categorias_Acessibilidade WHERE id = ?', [id]);
  return rows[0];
}

async function updateCategoria(id, { nome }) {
  const [result] = await pool.execute(
    'UPDATE Categorias_Acessibilidade SET nome = ? WHERE id = ?',
    [nome, id]
  );
  return result.affectedRows > 0;
}

async function deleteCategoria(id) {
  // Cuidado: Idealmente, você deve verificar se existem itens associados antes de deletar.
  const [result] = await pool.execute('DELETE FROM Categorias_Acessibilidade WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  createCategoria,
  getAllCategorias,
  getCategoriaById,
  updateCategoria,
  deleteCategoria,
};