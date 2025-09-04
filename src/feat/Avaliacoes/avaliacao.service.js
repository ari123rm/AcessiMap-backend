// src/services/avaliacaoService.js
const pool = require('../../config/db');

async function createAvaliacoes(avaliacoes, id_usuario) {
  const connection = await pool.getConnection();
  try {
    // Inicia a transação
    await connection.beginTransaction();

    const sql = `
      INSERT INTO Avaliacoes_Usuarios (id_estabelecimento, id_item_acessibilidade, possui_item, id_usuario)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE possui_item = VALUES(possui_item)
    `;

    // Loop para preparar todas as inserções
    for (const avaliacao of avaliacoes) {
      await connection.execute(sql, [
        avaliacao.id_estabelecimento,
        avaliacao.id_item_acessibilidade,
        avaliacao.possui_item,
        id_usuario
      ]);
    }

    // Se tudo deu certo, confirma as inserções no banco
    await connection.commit();
    return { message: `${avaliacoes.length} avaliações salvas com sucesso.` };

  } catch (error) {
    // Se algo deu errado, desfaz tudo
    await connection.rollback();
    console.error('Erro ao salvar avaliações:', error);
    throw new Error('Falha ao salvar avaliações.');
  } finally {
    connection.release();
  }
}

async function getAvaliacoesByEstabelecimento(id_estabelecimento) {
  const [rows] = await pool.execute(
    'SELECT * FROM Avaliacoes_Usuarios WHERE id_estabelecimento = ?',
    [id_estabelecimento]
  );
  return rows;
}

async function deleteAvaliacao(id) {
    // Geralmente um usuário só pode deletar a própria avaliação, ou um admin.
    const [result] = await pool.execute('DELETE FROM Avaliacoes_Usuarios WHERE id = ?', [id]);
    return result.affectedRows > 0;
}
async function createCategoriaAvaliacoes(avaliacoes, id_usuario) {
  const connection = await pool.getConnection();
  try {
    // Inicia a transação
    await connection.beginTransaction();

    const sql = `
      INSERT INTO Avaliacoes_Categorias (id_estabelecimento, id_categoria,nota,id_usuario)
      VALUES (?, ?, ?,  ?)
       ON DUPLICATE KEY UPDATE nota = VALUES(nota);
    `;

    // Loop para preparar todas as inserções
    
    for (const avaliacao of avaliacoes) {
      await connection.execute(sql, [
        avaliacao.id_estabelecimento,
        avaliacao.id_categoria,
        avaliacao.nota,
        
        id_usuario,
      ]);
    }

    // Se tudo deu certo, confirma as inserções no banco
    await connection.commit();
    return { message: `${avaliacoes.length} avaliações salvas com sucesso.` };

  } catch (error) {
    // Se algo deu errado, desfaz tudo
    await connection.rollback();
    console.error('Erro ao salvar avaliações:', error);
    throw new Error('Falha ao salvar avaliações.');
  } finally {
    connection.release();
  }
}

async function findMinhasAvaliacoesPorLugar(id_usuario, id_estabelecimento) {
  const connection = await pool.getConnection();
  try {
    // 1. Busca as avaliações do checklist (Sim/Não)
    const sqlChecklist = `
      SELECT id_item_acessibilidade, possui_item
      FROM Avaliacoes_Usuarios
      WHERE id_usuario = ? AND id_estabelecimento = ?
    `;
    const [checklistRows] = await connection.execute(sqlChecklist, [id_usuario, id_estabelecimento]);

    // 2. Busca as notas de categoria (estrelas)
    const sqlRatings = `
      SELECT id_categoria, nota
      FROM Avaliacoes_Categorias
      WHERE id_usuario = ? AND id_estabelecimento = ?
    `;
    const [ratingRows] = await connection.execute(sqlRatings, [id_usuario, id_estabelecimento]);

    return {
      checklist: checklistRows,
      ratings: ratingRows
    };
  } finally {
    connection.release();
  }
}


module.exports = { createAvaliacoes, getAvaliacoesByEstabelecimento, deleteAvaliacao ,createCategoriaAvaliacoes,findMinhasAvaliacoesPorLugar};