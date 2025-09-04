const pool = require('../../config/db');

/**
 * Busca todos os tipos de estabelecimentos cadastrados.
 * @returns {Promise<Array>} Uma lista de todos os tipos.
 */
async function getAllTipos() {
  const connection = await pool.getConnection();
  try {
    const sql = "SELECT * FROM Tipos ORDER BY nome ASC";
    const [rows] = await connection.execute(sql);
    return rows;
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  getAllTipos,
};