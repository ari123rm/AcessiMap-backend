const { pool } = require('../../config/db');

/**
 * Busca todos os tipos de estabelecimentos cadastrados.
 * @returns {Promise<Array>} Uma lista de todos os tipos.
 */
async function getAllTipos() {
  // Para uma única consulta, podemos usar pool.query() diretamente.
  // A biblioteca 'pg' gerencia o 'pegar e devolver' da conexão para nós.
  const sql = 'SELECT * FROM "Tipos" ORDER BY nome ASC';
  const { rows } = await pool.query(sql);
  return rows;
}

module.exports = {
  getAllTipos,
};