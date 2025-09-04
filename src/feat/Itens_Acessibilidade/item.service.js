const { pool } = require('../../config/db');

/**
 * Cria um novo item de acessibilidade.
 * @returns {Promise<object>} O objeto do item recém-criado.
 */
async function createItem({ nome, id_categoria, peso }) {
  const sql = `
    INSERT INTO "Itens_Acessibilidade" (nome, id_categoria, peso) 
    VALUES ($1, $2, $3) 
    RETURNING *;
  `;
  const { rows } = await pool.query(sql, [nome, id_categoria, peso]);
  return rows[0];
}

/**
 * Busca todos os itens de acessibilidade com o nome da categoria.
 * @returns {Promise<Array>} Uma lista de todos os itens.
 */
async function getAllItens() {
  const sql = `
    SELECT 
      i.id, i.nome, i.peso, i.id_categoria, c.nome as categoria_nome
    FROM "Itens_Acessibilidade" i
    JOIN "Categorias_Acessibilidade" c ON i.id_categoria = c.id
    ORDER BY c.id, i.nome;
  `;
  const { rows } = await pool.query(sql);
  return rows;
}

/**
 * Busca um item pelo seu ID.
 * @returns {Promise<object|undefined>} O objeto do item ou undefined se não for encontrado.
 */
async function getItemById(id) {
  const { rows } = await pool.query('SELECT * FROM "Itens_Acessibilidade" WHERE id = $1', [id]);
  return rows[0];
}

/**
 * Atualiza um item de acessibilidade.
 * @returns {Promise<object|null>} O objeto do item atualizado ou null se não for encontrado.
 */
async function updateItem(id, itemData) {
  const { nome, id_categoria, peso } = itemData;
  const sql = `
    UPDATE "Itens_Acessibilidade" 
    SET nome = $1, id_categoria = $2, peso = $3 
    WHERE id = $4 
    RETURNING *;
  `;
  const { rows } = await pool.query(sql, [nome, id_categoria, peso, id]);
  return rows[0] || null;
}

/**
 * Deleta um item de acessibilidade pelo seu ID.
 * @returns {Promise<boolean>} Retorna 'true' se a deleção foi bem-sucedida, 'false' caso contrário.
 */
async function deleteItem(id) {
  const result = await pool.query('DELETE FROM "Itens_Acessibilidade" WHERE id = $1', [id]);
  // 'rowCount' informa quantas linhas foram afetadas
  return result.rowCount > 0;
}

module.exports = {
  createItem,
  getAllItens,
  getItemById,
  updateItem,
  deleteItem,
};