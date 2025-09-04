const { pool } = require('../../config/db');

/**
 * Cria ou atualiza as avaliações do checklist (Sim/Não) para um usuário.
 */
async function createAvaliacoes(avaliacoes, id_usuario) {
  const connection = await pool.connect();
  try {
    await connection.query('BEGIN'); // Inicia a transação

    const sql = `
      INSERT INTO "Avaliacoes_Usuarios" (id_estabelecimento, id_item_acessibilidade, possui_item, id_usuario)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id_usuario, id_estabelecimento, id_item_acessibilidade) 
      DO UPDATE SET possui_item = EXCLUDED.possui_item;
    `;

    for (const avaliacao of avaliacoes) {
      await connection.query(sql, [
        avaliacao.id_estabelecimento,
        avaliacao.id_item_acessibilidade,
        avaliacao.possui_item,
        id_usuario
      ]);
    }

    await connection.query('COMMIT'); // Confirma a transação
    return { message: `${avaliacoes.length} avaliações de itens salvas com sucesso.` };
  } catch (error) {
    await connection.query('ROLLBACK'); // Desfaz em caso de erro
    console.error('Erro ao salvar avaliações de itens:', error);
    throw new Error('Falha ao salvar avaliações de itens.');
  } finally {
    connection.release(); // Libera a conexão de volta para o pool
  }
}

/**
 * Cria ou atualiza as notas de categoria (estrelas) para um usuário.
 */
async function createCategoriaAvaliacoes(avaliacoes, id_usuario) {
  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');

    const sql = `
      INSERT INTO "Avaliacoes_Categorias" (id_estabelecimento, id_categoria, nota, id_usuario)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id_usuario, id_estabelecimento, id_categoria) 
      DO UPDATE SET nota = EXCLUDED.nota;
    `;
    
    for (const avaliacao of avaliacoes) {
      await connection.query(sql, [
        avaliacao.id_estabelecimento,
        avaliacao.id_categoria,
        avaliacao.nota,
        id_usuario,
      ]);
    }

    await connection.query('COMMIT');
    return { message: `${avaliacoes.length} notas de categoria salvas com sucesso.` };
  } catch (error) {
    await connection.query('ROLLBACK');
    console.error('Erro ao salvar notas de categoria:', error);
    throw new Error('Falha ao salvar notas de categoria.');
  } finally {
    connection.release();
  }
}

/**
 * Busca as avaliações e notas de um usuário específico para um estabelecimento.
 */
async function findMinhasAvaliacoesPorLugar(id_usuario, id_estabelecimento) {
  try {
    // 1. Busca as avaliações do checklist (Sim/Não)
    const sqlChecklist = `
      SELECT id_item_acessibilidade, possui_item
      FROM "Avaliacoes_Usuarios"
      WHERE id_usuario = $1 AND id_estabelecimento = $2
    `;
    const { rows: checklistRows } = await pool.query(sqlChecklist, [id_usuario, id_estabelecimento]);

    // 2. Busca as notas de categoria (estrelas)
    const sqlRatings = `
      SELECT id_categoria, nota
      FROM "Avaliacoes_Categorias"
      WHERE id_usuario = $1 AND id_estabelecimento = $2
    `;
    const { rows: ratingRows } = await pool.query(sqlRatings, [id_usuario, id_estabelecimento]);

    // 3. Busca o comentário
    const sqlComentario = `
      SELECT comentario FROM "Comentarios"
      WHERE id_usuario = $1 AND id_estabelecimento = $2
    `;
    const { rows: comentarioRows } = await pool.query(sqlComentario, [id_usuario, id_estabelecimento]);

    return {
      checklist: checklistRows,
      ratings: ratingRows,
      comentario: comentarioRows[0]?.comentario || null
    };
  } catch (error) {
    console.error(`Erro ao buscar avaliações do usuário ${id_usuario} para o estabelecimento ${id_estabelecimento}:`, error);
    throw new Error('Falha ao buscar avaliações anteriores.');
  }
}

// Funções como 'getAvaliacoesByEstabelecimento' e 'deleteAvaliacao' podem ser adicionadas
// aqui se forem necessárias, seguindo o mesmo padrão de sintaxe do Postgres.

module.exports = { 
  createAvaliacoes,
  createCategoriaAvaliacoes,
  findMinhasAvaliacoesPorLugar
};