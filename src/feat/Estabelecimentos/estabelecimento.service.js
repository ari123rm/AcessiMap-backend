const { pool } = require('../../config/db');
const axios = require('axios');


async function _findOrCreateEstablishment(connection, googlePlaceId) {
  const sqlSelect = `
    SELECT id, nome, endereco, google_place_id, photo_reference,
           ST_Y(localizacao::geometry) as latitude, ST_X(localizacao::geometry) as longitude 
    FROM "Estabelecimentos" WHERE google_place_id = $1`;
  let { rows } = await connection.query(sqlSelect, [googlePlaceId]);

  if (rows.length > 0) {
    return { ...rows[0], isNew: false };
  }

  // Logic for creating a new establishment
  const googleApiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${googlePlaceId}&fields=name,formatted_address,geometry,photos,types&key=${process.env.GOOGLE_API_KEY}&language=pt-BR`;
  const response = await axios.get(googleApiUrl);
  const placeDetails = response.data.result;
  if (!placeDetails) throw new Error('Detalhes do lugar não encontrados no Google.');

  const { name, formatted_address, geometry, types } = placeDetails;
  const { lat, lng } = geometry.location;
  const photoRef = placeDetails.photos?.[0]?.photo_reference || null;


  
  await connection.query('BEGIN');
  try {
    const sqlInsert = `
      INSERT INTO "Estabelecimentos" (google_place_id, nome, endereco, localizacao, photo_reference) 
      VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6) 
      RETURNING id;
    `;
    const result = await connection.query(sqlInsert, [googlePlaceId, name, formatted_address, lng, lat, photoRef]);
    const estabelecimentoId = result.rows[0].id;

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
    if (types && types.length > 0) {
      for (const googleType of types) {
        if (priorityTypes[googleType]) nossosTipos.add(priorityTypes[googleType]);
      }
      for (const tipoNome of nossosTipos) {
        await connection.query('INSERT INTO "Tipos" (nome) VALUES ($1) ON CONFLICT (nome) DO NOTHING', [tipoNome]);
        const tipoResult = await connection.query('SELECT id FROM "Tipos" WHERE nome = $1', [tipoNome]);
        const tipoId = tipoResult.rows[0].id;
        await connection.query('INSERT INTO "Estabelecimento_Tipos" (id_estabelecimento, id_tipo) VALUES ($1, $2)', [estabelecimentoId, tipoId]);
      }
    }
    await connection.query('COMMIT');
    
    // Return the newly created object with all necessary
    //  data
    console.log(photoRef)
    
    return {
      id: estabelecimentoId,
      nome: name,
      endereco: formatted_address,
      google_place_id: googlePlaceId,
      photo_reference: photoRef,
      latitude: lat,
      longitude: lng,
      isNew: true,
      tipos: [...nossosTipos],
    };
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  }
}

async function _getChecklistData(connection, estabelecimentoId) {
  const sql = `
    SELECT ia.id_categoria, ca.nome as nome_categoria, ia.peso, av.possui_item, ia.nome as nome_item
    FROM "Avaliacoes_Usuarios" av
    JOIN "Itens_Acessibilidade" ia ON av.id_item_acessibilidade = ia.id
    JOIN "Categorias_Acessibilidade" ca ON ia.id_categoria = ca.id
    WHERE av.id_estabelecimento = $1`;
  const { rows: itemReviews } = await connection.query(sql, [estabelecimentoId]);

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
  const sql = `SELECT id_categoria, AVG(nota) as media_nota FROM "Avaliacoes_Categorias" WHERE id_estabelecimento = $1 GROUP BY id_categoria`;
  const { rows } = await connection.query(sql, [estabelecimentoId]);
  return rows;
}

/**
 * Busca os comentários de um estabelecimento.
 * @returns {Promise<Array>}
 */
async function _getComments(connection, estabelecimentoId) {
  const sql = `
    SELECT c.id, c.comentario, c.criado_em, u.nome as autor_nome, u.id as autor_id,
           (SELECT AVG(ac.nota) FROM "Avaliacoes_Categorias" ac 
            WHERE ac.id_usuario = c.id_usuario AND ac.id_estabelecimento = c.id_estabelecimento) as autor_nota_media
    FROM "Comentarios" c JOIN "Usuarios" u ON c.id_usuario = u.id
    WHERE c.id_estabelecimento = $1 ORDER BY c.criado_em DESC LIMIT 10`;
  const { rows } = await connection.query(sql, [estabelecimentoId]);
  return rows;
}

/**
 * Conta o número de avaliadores únicos.
 * @returns {Promise<number>}
 */
async function _getTotalReviewers(connection, estabelecimentoId) {
  const sql = `
    SELECT COUNT(DISTINCT id_usuario) as totalAvaliacoes FROM (
        SELECT id_usuario FROM "Avaliacoes_Usuarios" WHERE id_estabelecimento = $1
        UNION
        SELECT id_usuario FROM "Avaliacoes_Categorias" WHERE id_estabelecimento = $1
    ) as usuarios_unicos;`;
  const { rows } = await connection.query(sql, [estabelecimentoId]);
  return rows[0]?.totalavaliacoes || 0;
}



// --- FUNÇÃO PRINCIPAL (ORQUESTRADORA) ---

async function getRankingByPlaceId(googlePlaceId) {
 const connection = await pool.connect();

  try {
    
    const estabelecimento = await _findOrCreateEstablishment(connection, googlePlaceId);

       //const photoUrl = estabelecimento.photo_reference ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${estabelecimento.photo_reference}&key=${process.env.GOOGLE_API_KEY}`: null

      const photoUrl = `https://lh3.googleusercontent.com/place-photos/AJnk2cwd_ledODlMpnG4obt7w9WEmDwhqeDO1PYXtoP2gUynKzIMu9ICADSjwXvp310C_CHf-UJgsC4cAZQgDofNYT64ciNPQqvzsHD3PsY6Vbf6nlFYhFPTwAf8iKvVU_VMUWvd75tS1dmYVlANf5w=s1600-w400`;

    

    if (estabelecimento.isNew) {
      delete estabelecimento.isNew;
      return {
        ...estabelecimento,
        photoUrl, 
        meucu:10,
        scores: [],
        avaliacoesDetalhes: [],
        comentarios: [],
        totalAvaliacoes: 0,
      };
    }

    const sqlTipos = `SELECT t.nome FROM "Tipos" t JOIN "Estabelecimento_Tipos" et ON t.id = et.id_tipo WHERE et.id_estabelecimento = $1`;
    const [checklistData, communityRatings, comments, totalReviewers, tiposRows] = await Promise.all([
      _getChecklistData(connection, estabelecimento.id),
      _getCommunityRatings(connection, estabelecimento.id),
      _getComments(connection, estabelecimento.id),
      _getTotalReviewers(connection, estabelecimento.id),
      connection.query(sqlTipos, [estabelecimento.id])
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

    return {
      ...estabelecimento,
      photoUrl,
      totalAvaliacoes: totalReviewers,
      scores: scoresCombinados,
      avaliacoesDetalhes: checklistData.itemReviews,
      comentarios: comments,
      tipos: tiposRows.rows.map(row => row.nome),
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
  const sql = `
    SELECT id, nome, google_place_id, ST_X(localizacao::geometry) as longitude, ST_Y(localizacao::geometry) as latitude 
    FROM "Estabelecimentos"
    WHERE ST_Contains(ST_MakeEnvelope($1, $2, $3, $4, 4326), localizacao)
    LIMIT 100;`;
  const { rows } = await pool.query(sql, [swLng, swLat, neLng, neLat]);
  return rows;
}

module.exports = {
  getRankingByPlaceId,
  findInMapBounds,
};