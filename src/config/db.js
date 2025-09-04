const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Uma função para verificar a conexão com o banco de dados.
 * Ela tenta executar uma query simples. Se funcionar, tudo certo.
 * Se falhar, ela encerra a aplicação para evitar erros inesperados.
 */
const checkConnection = async () => {
  try {
    await pool.query('SELECT NOW()'); // Query simples para testar a conexão
    console.log('✅ Conexão com o banco de dados PostgreSQL estabelecida com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
    process.exit(-1); // Encerra o processo se não conseguir conectar
  }
};

// Remova os listeners antigos
// pool.on('connect', ...);
// pool.on('error', ...);

// Exporte tanto o pool quanto a função de verificação
module.exports = { pool, checkConnection };