// src/feat/Rankings/ranking.service.js
const pool = require('../../config/db');

async function getRankings({ sortBy = 'average', filterByType = null }) {
  const connection = await pool.getConnection();
  try {
    const params = [];
    let baseQuery = `
      SELECT 
        e.id, 
        e.nome, 
        e.google_place_id,
        e.photo_reference,
        AVG(ac.nota) as mediaGeral
      FROM Estabelecimentos e
      JOIN Avaliacoes_Categorias ac ON e.id = ac.id_estabelecimento
    `;

    let whereClauses = [];

    // Filtro por tipo de estabelecimento (ex: "Restaurante")
    if (filterByType) {
      // Adicionamos um JOIN extra apenas se o filtro for necessário
      baseQuery += ` JOIN Estabelecimento_Tipos et ON e.id = et.id_estabelecimento `;
      whereClauses.push(`et.id_tipo = ?`);
      params.push(filterByType);
    }

    // Filtro para calcular a média de uma categoria específica
    if (sortBy !== 'average') { 
      whereClauses.push(`ac.id_categoria = ?`);
      params.push(sortBy);
    }

    if (whereClauses.length > 0) {
      baseQuery += ` WHERE ` + whereClauses.join(' AND ');
    }

    baseQuery += `
      GROUP BY e.id
      HAVING COUNT(ac.id) > 0 -- Garante que há avaliações
      ORDER BY mediaGeral DESC
      LIMIT 20; -- Pega o Top 20
    `;

    pool.format(baseQuery, params);
    
    const [rows] = await connection.execute(baseQuery, params);

    // Monta as URLs das fotos
    return rows.map(row => ({
      ...row,
      mediaGeral: parseFloat(row.mediaGeral),
      photoUrl: row.photo_reference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${row.photo_reference}&key=${process.env.GOOGLE_API_KEY}`
        : null
    }));

  } finally {
    if (connection) connection.release();
  }
}

module.exports = { getRankings };