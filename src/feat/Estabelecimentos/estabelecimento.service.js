const pool = require('../../config/db');
const axios = require('axios');

// --- FUNÇÕES AJUDANTES (HELPERS) ---
/**
 * Busca um estabelecimento no DB. Se não encontrar, busca no Google e o cria.
 * @param {object} connection - A conexão ativa com o banco de dados.
 * @param {string} googlePlaceId - O ID do Google Places.
 * @returns {Promise<object>} O objeto do estabelecimento (com uma flag 'isNew' se for novo).
 */
async function _findOrCreateEstablishment(connection, googlePlaceId) {
  const sqlSelect = `
    SELECT id, nome, endereco, google_place_id, photo_reference,
           ST_Y(localizacao) as latitude, ST_X(localizacao) as longitude 
    FROM Estabelecimentos WHERE google_place_id = ?`;
  let [rows] = await connection.execute(sqlSelect, [googlePlaceId]);

  if (rows.length > 0) {
    return rows[0];
  }

  console.log(`Estabelecimento ${googlePlaceId} não encontrado no DB. Buscando no Google...`);
  const googleApiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${googlePlaceId}&fields=name,formatted_address,geometry,photos,types&key=${process.env.GOOGLE_API_KEY}&language=pt-BR`;
  const response = await axios.get(googleApiUrl);
  const placeDetails = response.data.result;

  if (!placeDetails) {
    throw new Error('Detalhes do lugar não encontrados no Google.');
  }

  const { name, formatted_address, geometry, types } = placeDetails;
  const { lat, lng } = geometry.location;
  const photoRef = placeDetails.photos?.[0]?.photo_reference || null;
  
  await connection.beginTransaction();
  try {
    // Insere o estabelecimento principal
    const sqlInsert = `INSERT INTO Estabelecimentos (google_place_id, nome, endereco, localizacao, photo_reference) VALUES (?, ?, ?, ST_GeomFromText(?), ?)`;
    const point = `POINT(${lng} ${lat})`;
    const [result] = await connection.execute(sqlInsert, [googlePlaceId, name, formatted_address, point, photoRef]);
    const estabelecimentoId = result.insertId;

    // --- LÓGICA CORRIGIDA PARA MÚLTIPLOS TIPOS ---
    if (types && types.length > 0) {
      // Este mapa de tradução agora está preenchido
      const priorityTypes = {
        'restaurant': 'Restaurante',
        'shopping_mall': 'Shopping',
        'cafe': 'Café',
        'bar': 'Bar',
        'park': 'Parque',
        'museum': 'Museu',
        'movie_theater': 'Cinema',
        'store': 'Loja',
        'lodging': 'Hospedagem',
        'university': 'Universidade',
        'school': 'Escola',
        'hospital': 'Hospital',
        'drugstore': 'Farmácia',
        'supermarket': 'Supermercado',
        'point_of_interest': 'Ponto de Interesse',
        'establishment': 'Estabelecimento'
      };

      const nossosTipos = new Set();
      for (const googleType of types) {
        if (priorityTypes[googleType]) {
          nossosTipos.add(priorityTypes[googleType]);
        }
      }

      console.log('Tipos do Google:', types, '-> Tipos traduzidos:', [...nossosTipos]);

      for (const tipoNome of nossosTipos) {
        await connection.execute(
          'INSERT INTO Tipos (nome) VALUES (?) ON DUPLICATE KEY UPDATE nome=nome',
          [tipoNome]
        );
        const [tipoRows] = await connection.execute('SELECT id FROM Tipos WHERE nome = ?', [tipoNome]);
        const tipoId = tipoRows[0].id;

        await connection.execute(
          'INSERT INTO Estabelecimento_Tipos (id_estabelecimento, id_tipo) VALUES (?, ?)',
          [estabelecimentoId, tipoId]
        );
      }
    }

    await connection.commit();

    // Busca os tipos que acabamos de inserir para retornar ao frontend
    const sqlTipos = `
      SELECT t.nome FROM Tipos t
      JOIN Estabelecimento_Tipos et ON t.id = et.id_tipo
      WHERE et.id_estabelecimento = ?`;
    const [tiposRows] = await connection.execute(sqlTipos, [estabelecimentoId]);
    const tipos = tiposRows.map(row => row.nome);

    const photoUrl = photoRef
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${process.env.GOOGLE_API_KEY}`
      : null;
    
    // Retorna o objeto completo para o frontend
    return {
      id: estabelecimentoId,
      google_place_id: googlePlaceId,
      nome: name,
      endereco: formatted_address,
      latitude: lat,
      longitude: lng,
      photoUrl,
      tipos: tipos, // Inclui os tipos recém-criados
      scores: [],
      totalAvaliacoes: 0,
      avaliacoesDetalhes: [],
      comentarios: [],
      isNew: true,
    };

  } catch (error) {
    await connection.rollback();
    console.error("Erro na transação de criação de estabelecimento:", error);
    throw error;
  }
}

/**
 * Calcula os scores objetivos (checklist) e agrega os dados para o tooltip.
 * @returns {Promise<{scoresFinais: Array, itemReviews: Array, aggregatedChecklist: Object}>}
 */
async function _getChecklistData(connection, estabelecimentoId) {
  const sql = `
    SELECT ia.id_categoria, ca.nome as nome_categoria, ia.peso, av.possui_item, ia.nome as nome_item
    FROM Avaliacoes_Usuarios av
    JOIN Itens_Acessibilidade ia ON av.id_item_acessibilidade = ia.id
    JOIN Categorias_Acessibilidade ca ON ia.id_categoria = ca.id
    WHERE av.id_estabelecimento = ?`;
  const [itemReviews] = await connection.execute(sql, [estabelecimentoId]);

  const scoresPorCategoria = {};
  const aggregatedChecklist = {};

  itemReviews.forEach(review => {
    const catId = review.id_categoria;
    // Agregação para o cálculo de score
    if (!scoresPorCategoria[catId]) {
      scoresPorCategoria[catId] = { nome_categoria: review.nome_categoria, itens: {} };
    }
    if (!scoresPorCategoria[catId].itens[review.nome_item]) {
      scoresPorCategoria[catId].itens[review.nome_item] = { peso: review.peso, votos_sim: 0, total_votos: 0 };
    }
    if (review.possui_item) {
      scoresPorCategoria[catId].itens[review.nome_item].votos_sim++;
    }
    scoresPorCategoria[catId].itens[review.nome_item].total_votos++;

    // Agregação para o tooltip
    if (!aggregatedChecklist[catId]) {
      aggregatedChecklist[catId] = {};
    }
    if (!aggregatedChecklist[catId][review.nome_item]) {
      aggregatedChecklist[catId][review.nome_item] = { sim: 0, total: 0 };
    }
    if (review.possui_item) {
      aggregatedChecklist[catId][review.nome_item].sim++;
    }
    aggregatedChecklist[catId][review.nome_item].total++;
  });
  
  const scoresFinais = Object.entries(scoresPorCategoria).map(([catId, categoria]) => {
     let scoreParcial = 0;
     let pesoTotal = 0;
     for (const itemName in categoria.itens) {
       const item = categoria.itens[itemName];
       if (item.total_votos > 0) {
         scoreParcial += (item.votos_sim / item.total_votos) * item.peso;
       }
       pesoTotal += item.peso;
     }
     return {
       id_categoria: Number(catId),
       categoria: categoria.nome_categoria,
       score: pesoTotal > 0 ? parseFloat(((scoreParcial / pesoTotal) * 100).toFixed(2)) : 0,
     };
  });

  return { scoresFinais, itemReviews, aggregatedChecklist };
}

/**
 * Busca a média das notas da comunidade (estrelas).
 * @returns {Promise<Array>}
 */
async function _getCommunityRatings(connection, estabelecimentoId) {
  const sql = `
    SELECT id_categoria, AVG(nota) as media_nota FROM Avaliacoes_Categorias
    WHERE id_estabelecimento = ? GROUP BY id_categoria`;
  const [rows] = await connection.execute(sql, [estabelecimentoId]);
  return rows;
}

/**
 * Busca os comentários de um estabelecimento.
 * @returns {Promise<Array>}
 */
async function _getComments(connection, estabelecimentoId) {
  const sql = `
    SELECT 
      c.id, 
      c.comentario, 
      c.criado_em, 
      u.nome as autor_nome,
      u.id as autor_id,
      (SELECT AVG(ac.nota) 
       FROM Avaliacoes_Categorias ac 
       WHERE ac.id_usuario = c.id_usuario AND ac.id_estabelecimento = c.id_estabelecimento) as autor_nota_media
    FROM Comentarios c 
    JOIN Usuarios u ON c.id_usuario = u.id
    WHERE c.id_estabelecimento = ? 
    ORDER BY c.criado_em DESC 
    LIMIT 10;
  `;
  const [rows] = await connection.execute(sql, [estabelecimentoId]);
  return rows;
}

/**
 * Conta o número de avaliadores únicos.
 * @returns {Promise<number>}
 */
async function _getTotalReviewers(connection, estabelecimentoId) {
  const sql = `
    SELECT COUNT(DISTINCT id_usuario) as totalAvaliacoes FROM (
        SELECT id_usuario FROM Avaliacoes_Usuarios WHERE id_estabelecimento = ?
        UNION
        SELECT id_usuario FROM Avaliacoes_Categorias WHERE id_estabelecimento = ?
    ) as usuarios_unicos;`;
  const [rows] = await connection.execute(sql, [estabelecimentoId, estabelecimentoId]);
  return rows[0]?.totalAvaliacoes || 0;
}




// --- FUNÇÃO PRINCIPAL (ORQUESTRADORA) ---

async function getRankingByPlaceId(googlePlaceId) {
  const connection = await pool.getConnection();
  try {
    const estabelecimento = await _findOrCreateEstablishment(connection, googlePlaceId);

    if (estabelecimento.isNew) {
      delete estabelecimento.isNew;

      return estabelecimento;
    }

    const [checklistData, communityRatings, comments, totalReviewers] = await Promise.all([
      _getChecklistData(connection, estabelecimento.id),
      _getCommunityRatings(connection, estabelecimento.id),
      _getComments(connection, estabelecimento.id),
      _getTotalReviewers(connection, estabelecimento.id),
    ]);

    const scoresCombinados = checklistData.scoresFinais.map(score => {
      const notaEncontrada = communityRatings.find(n => n.id_categoria === score.id_categoria);
      const checklistTooltipData = checklistData.aggregatedChecklist[score.id_categoria] || {};
      const tooltipItems = Object.entries(checklistTooltipData).map(([itemName, votes]) => ({
        nome: itemName,
        percentualSim: (votes.sim / votes.total) * 100
      }));
      
      return {
        ...score,
        notaComunidade: notaEncontrada ? parseFloat(notaEncontrada.media_nota) : null,
        tooltipData: { items: tooltipItems }
      };
    });

    const photoUrl = estabelecimento.photo_reference
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${estabelecimento.photo_reference}&key=${process.env.GOOGLE_API_KEY}`
      : null;
      const sqlTipos = `
        SELECT t.nome FROM Tipos t
        JOIN Estabelecimento_Tipos et ON t.id = et.id_tipo
        WHERE et.id_estabelecimento = ?
      `;
      const [tiposRows] = await connection.execute(sqlTipos, [estabelecimento.id]);
      // Mapeia o resultado para um array de strings
      const tipos = tiposRows.map(row => row.nome);


    return {
      ...estabelecimento,
      photoUrl,
      totalAvaliacoes: totalReviewers,
      scores: scoresCombinados,
      avaliacoesDetalhes: checklistData.itemReviews,
      comentarios: comments,
      tipos,
    };

  } catch (error) {
    console.error("ERRO DETALHADO na função getRankingByPlaceId:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// --- Outras Funções do Service ---
async function findInMapBounds({ swLat, swLng, neLat, neLng }) {
  const boundingBox = `POLYGON((${swLng} ${swLat}, ${neLng} ${swLat}, ${neLng} ${neLat}, ${swLng} ${neLat}, ${swLng} ${swLat}))`;
  const sql = `
    SELECT id, nome, google_place_id, ST_X(localizacao) as longitude, ST_Y(localizacao) as latitude 
    FROM Estabelecimentos WHERE MBRContains(ST_GeomFromText(?), localizacao) LIMIT 100;`;
  
  const [rows] = await pool.execute(sql, [boundingBox]);
  return rows;
}

module.exports = {
  getRankingByPlaceId,
  findInMapBounds,
};