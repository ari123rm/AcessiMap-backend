const pool = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Para gerar o token
const { sendVerificationEmail } = require('../../services/emailService'); // Importe o serviço de email
const dotenv = require('dotenv');
dotenv.config();



async function register({ nome, email, senha }) {
  const senhaHash = await bcrypt.hash(senha, 10);
  
  // Gera um token de verificação seguro
  const verificationToken = crypto.randomBytes(32).toString('hex');
  // Define a expiração do token para 1 hora a partir de agora
  const verificationTokenExpires = new Date(Date.now() + 3600000); // 1 hora em milissegundos

  const [result] = await pool.execute(
    'INSERT INTO Usuarios (nome, email, senha, verification_token, verification_token_expires) VALUES (?, ?, ?, ?, ?)',
    [nome, email, senhaHash, verificationToken, verificationTokenExpires]
  );
  
  // Envia o e-mail de verificação
  await sendVerificationEmail(email, verificationToken);

  // Não retorna mais um token de login, apenas o usuário criado
  return { id: result.insertId, nome, email };
}

async function login({ email, senha }) {
  const [rows] = await pool.execute('SELECT * FROM Usuarios WHERE email = ?', [email]);
  if (rows.length === 0) throw new Error('Email ou senha inválidos.');
  
  const usuario = rows[0];

  // NOVA VERIFICAÇÃO: Checa se o e-mail foi verificado
  if (!usuario.is_verified) {
    throw new Error('Por favor, verifique seu e-mail para ativar sua conta antes de fazer login.');
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) throw new Error('Email ou senha inválidos.');

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email, photo_url: usuario.photo_url, role: usuario.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  return { token };
}

// NOVA FUNÇÃO para verificar o token
async function verifyEmail(token) {
  const sql = `
    SELECT * FROM Usuarios 
    WHERE verification_token = ? AND verification_token_expires > NOW()
  `;
  const [rows] = await pool.execute(sql, [token]);
  if (rows.length === 0) {
    throw new Error('Token de verificação inválido ou expirado.');
  }

  const usuario = rows[0];

  // Atualiza o usuário para o status de verificado
  await pool.execute(
    'UPDATE Usuarios SET is_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
    [usuario.id]
  );

  return { message: 'Email verificado com sucesso! Agora você pode fazer login.' };
}

module.exports = { register, login, verifyEmail };