const pool = require('../../config/db');
const axios = require('axios');
// Renomeamos a função para refletir sua nova capacidade
async function upsertComentario(id_usuario, id_estabelecimento, comentario) {
  const sql = `
    INSERT INTO Comentarios (id_usuario, id_estabelecimento, comentario) 
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE comentario = VALUES(comentario);
  `;
  const [result] = await pool.execute(sql, [id_usuario, id_estabelecimento, comentario]);
  
  // Busca o comentário recém-criado ou atualizado para retornar o objeto completo
  // Usamos um truque para pegar o ID correto tanto no INSERT quanto no UPDATE
  const id = result.insertId || (await pool.execute('SELECT id FROM Comentarios WHERE id_usuario = ? AND id_estabelecimento = ?', [id_usuario, id_estabelecimento]))[0][0].id;
  const [rows] = await pool.execute('SELECT * FROM Comentarios WHERE id = ?', [id]);
  return rows[0];
}

module.exports = { upsertComentario };