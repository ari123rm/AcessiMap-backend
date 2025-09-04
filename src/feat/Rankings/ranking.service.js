const { pool } = require('../../config/db');

/**
 * Busca os estabelecimentos ranqueados com base em filtros dinâmicos.
 * @param {object} options - Opções de filtro.
 * @param {string} options.sortBy - Critério de ordenação ('average' ou um ID de categoria).
 * @param {string|null} options.filterByType - ID do tipo de estabelecimento para filtrar.
 * @returns {Promise<Array>} Uma lista de estabelecimentos ranqueados.
 */
async function getRankings({ sortBy = 'average', filterByType = null }) {
  try {
    const params = [];
    let paramIndex = 1;
    let baseQuery = `
      SELECT 
        e.id, 
        e.nome, 
        e.google_place_id,
        e.photo_reference,
        AVG(ac.nota) as "mediaGeral"
      FROM "Estabelecimentos" e
      JOIN "Avaliacoes_Categorias" ac ON e.id = ac.id_estabelecimento
    `;

    let whereClauses = [];

    // Filtro por tipo de estabelecimento (ex: "Restaurante")
    if (filterByType && filterByType !== 'all') {
      baseQuery += ` JOIN "Estabelecimento_Tipos" et ON e.id = et.id_estabelecimento `;
      whereClauses.push(`et.id_tipo = $${paramIndex++}`);
      params.push(filterByType);
    }

    // Filtro para calcular a média de uma categoria específica
    if (sortBy !== 'average') {
      whereClauses.push(`ac.id_categoria = $${paramIndex++}`);
      params.push(sortBy);
    }

    if (whereClauses.length > 0) {
      baseQuery += ` WHERE ` + whereClauses.join(' AND ');
    }

    baseQuery += `
      GROUP BY e.id
      HAVING COUNT(ac.id) > 0 -- Opcional: só ranqueia lugares com alguma avaliação
      ORDER BY "mediaGeral" DESC
      LIMIT 20;
    `;
    
    // Executa a query diretamente do pool
    const { rows } = await pool.query(baseQuery, params);

    // Monta as URLs das fotos e formata o resultado
    return rows.map(row => ({
      ...row,
      mediaGeral: parseFloat(row.mediaGeral), // Garante que a média seja um número
      photoUrl: row.photo_reference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${row.photo_reference}&key=${process.env.GOOGLE_API_KEY}`
        : null
    }));

  } catch (error) {
    console.error("Erro ao buscar rankings:", error);
    throw new Error("Não foi possível carregar os rankings.");
  }
}

module.exports = { getRankings };