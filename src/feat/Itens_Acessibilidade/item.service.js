// src/services/itemService.js
const pool = require('../../config/db');

async function createItem({ nome, id_categoria, peso }) {
  const [result] = await pool.execute(
    'INSERT INTO Itens_Acessibilidade (nome, id_categoria, peso) VALUES (?, ?, ?)',
    [nome, id_categoria, peso]
  );
  return { id: result.insertId, nome, id_categoria, peso };
}

async function getAllItens() {
  // A consulta SQL que une as tabelas de itens e categorias
  const sql = `
    SELECT 
      i.id, 
      i.nome, 
      i.peso, 
      i.id_categoria,
      c.nome as categoria_nome
    FROM Itens_Acessibilidade i
    JOIN Categorias_Acessibilidade c ON i.id_categoria = c.id
    ORDER BY c.id, i.nome;
  `;
  
  const [rows] = await pool.execute(sql);
  return rows;
}

// ... (getById, update, delete seguem o mesmo padrão)

async function getItemById(id) {
  const [rows] = await pool.execute('SELECT * FROM Itens_Acessibilidade WHERE id = ?', [id]);
  return rows[0];
}

async function updateItem(id, { nome }) {
  const [result] = await pool.execute(
    'UPDATE Itens_Acessibilidade SET nome = ? WHERE id = ?',
    [nome, id]
  );
  return result.affectedRows > 0;
}

async function deleteItem(id) {
  // Cuidado: Idealmente, você deve verificar se existem itens associados antes de deletar.
  const [result] = await pool.execute('DELETE FROM Itens_Acessibilidade WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  createItem,
  getAllItens,
  getItemById,
  updateItem,
  deleteItem,
};
