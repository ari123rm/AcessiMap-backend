const { pool } = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../../services/emailService');

/**
 * Registra um novo usuário, cria um token de verificação e envia o e-mail.
 * @returns {Promise<object>} O objeto do usuário recém-criado (sem a senha).
 */
async function register({ nome, email, senha }) {
  const senhaHash = await bcrypt.hash(senha, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpires = new Date(Date.now() + 3600000); // 1 hora a partir de agora

  const sql = `
    INSERT INTO "Usuarios" (nome, email, senha, verification_token, verification_token_expires) 
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, nome, email;
  `;
  
  const { rows } = await pool.query(sql, [
    nome, 
    email, 
    senhaHash, 
    verificationToken, 
    verificationTokenExpires
  ]);

  // Envia o e-mail de verificação
  await sendVerificationEmail(email, verificationToken);

  return rows[0];
}

/**
 * Autentica um usuário e retorna um token JWT.
 * @returns {Promise<object>} Um objeto contendo o token JWT.
 */
async function login({ email, senha }) {
  const sql = 'SELECT * FROM "Usuarios" WHERE email = $1';
  const { rows } = await pool.query(sql, [email]);
  
  if (rows.length === 0) {
    throw new Error('Email ou senha inválidos.');
  }
  
  const usuario = rows[0];

  if (!usuario.is_verified) {
    throw new Error('Por favor, verifique seu e-mail para ativar sua conta antes de fazer login.');
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) {
    throw new Error('Email ou senha inválidos.');
  }

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email, photo_url: usuario.photo_url, role: usuario.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return { token };
}

/**
 * Verifica um token de e-mail, e se for válido, ativa a conta do usuário.
 * @returns {Promise<object>} Uma mensagem de sucesso.
 */
async function verifyEmail(token) {
  const sqlSelect = `
    SELECT * FROM "Usuarios" 
    WHERE verification_token = $1 AND verification_token_expires > NOW()
  `;
  const { rows } = await pool.query(sqlSelect, [token]);

  if (rows.length === 0) {
    throw new Error('Token de verificação inválido ou expirado.');
  }

  const usuario = rows[0];

  const sqlUpdate = `
    UPDATE "Usuarios" 
    SET is_verified = TRUE, verification_token = NULL, verification_token_expires = NULL 
    WHERE id = $1
  `;
  await pool.query(sqlUpdate, [usuario.id]);

  return { message: 'Email verificado com sucesso! Agora você pode fazer login.' };
}

module.exports = { register, login, verifyEmail };