const { pool } = require('../../config/db');

/**
 * Cria uma nova categoria de acessibilidade.
 * @returns {Promise<object>} O objeto da categoria recém-criada.
 */
async function createCategoria({ nome }) {
  // Adicionamos "RETURNING *" para que o PostgreSQL retorne a linha inteira que foi criada.
  const sql = 'INSERT INTO "Categorias_Acessibilidade" (nome) VALUES ($1) RETURNING *';
  const { rows } = await pool.query(sql, [nome]);
  
  // O resultado já vem no array 'rows'.
  return rows[0];
}

/**
 * Busca todas as categorias de acessibilidade.
 * @returns {Promise<Array>} Uma lista de todas as categorias.
 */
async function getAllCategorias() {
  const { rows } = await pool.query('SELECT * FROM "Categorias_Acessibilidade" ORDER BY nome');
  return rows;
}

/**
 * Busca uma categoria pelo seu ID.
 * @returns {Promise<object|undefined>} O objeto da categoria ou undefined se não for encontrada.
 */
async function getCategoriaById(id) {
  const { rows } = await pool.query('SELECT * FROM "Categorias_Acessibilidade" WHERE id = $1', [id]);
  return rows[0];
}

/**
 * Atualiza o nome de uma categoria.
 * @returns {Promise<object|null>} O objeto da categoria atualizada ou null se não for encontrada.
 */
async function updateCategoria(id, { nome }) {
  const sql = 'UPDATE "Categorias_Acessibilidade" SET nome = $1 WHERE id = $2 RETURNING *';
  const { rows } = await pool.query(sql, [nome, id]);

  // Se a linha foi atualizada, o 'rows' terá o objeto. Se não, virá vazio.
  return rows[0] || null;
}

/**
 * Deleta uma categoria pelo seu ID.
 * @returns {Promise<boolean>} Retorna 'true' se a deleção foi bem-sucedida, 'false' caso contrário.
 */
async function deleteCategoria(id) {
  const result = await pool.query('DELETE FROM "Categorias_Acessibilidade" WHERE id = $1', [id]);
  
  // No 'pg', verificamos 'rowCount' para saber quantas linhas foram afetadas.
  return result.rowCount > 0;
}

module.exports = {
  createCategoria,
  getAllCategorias,
  getCategoriaById,
  updateCategoria,
  deleteCategoria,
};