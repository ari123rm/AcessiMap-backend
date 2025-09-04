const { pool } = require('../../config/db');

/**
 * Cria um novo comentário ou atualiza um existente do mesmo usuário
 * para o mesmo estabelecimento.
 * @returns {Promise<object>} O objeto do comentário criado ou atualizado.
 */
async function upsertComentario(id_usuario, id_estabelecimento, comentario) {
  try {
    // Esta única query faz tudo: insere, ou se houver conflito na chave única
    // (id_usuario, id_estabelecimento), ele atualiza o comentário.
    // O "RETURNING *" nos devolve a linha completa, seja ela nova ou atualizada.
    const sql = `
      INSERT INTO "Comentarios" (id_usuario, id_estabelecimento, comentario) 
      VALUES ($1, $2, $3)
      ON CONFLICT (id_usuario, id_estabelecimento) 
      DO UPDATE SET comentario = EXCLUDED.comentario
      RETURNING *;
    `;

    const { rows } = await pool.query(sql, [id_usuario, id_estabelecimento, comentario]);
    
    return rows[0];

  } catch (error) {
    console.error("Erro ao criar ou atualizar comentário:", error);
    throw new Error("Não foi possível salvar o comentário.");
  }
}

module.exports = { upsertComentario };