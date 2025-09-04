// src/feat/Auth/auth.routes.js
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Rota 1: O ponto de partida. Redireciona o usuário para o Google.
// O 'scope' diz ao Google quais informações queremos acessar.
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Rota 2: O Callback. O Google redireciona para cá após o login.
const FRONT_URL = process.env.FRONT_URL ||'http://localhost:3000';

router.get('/google/callback', 
  // Passport processa o código e executa a função de verificação que configuramos
  passport.authenticate('google', { session: false, failureRedirect: '/login-failed' }), // session: false para API
  (req, res) => {
    // Se a autenticação do Google foi bem-sucedida, o objeto 'req.user'
    // será populado pelo Passport com os dados do nosso banco.
    const usuario = req.user;

    // Agora, geramos o nosso próprio token JWT para o frontend
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, photo_url: usuario.photo_url, role: usuario.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Redireciona o usuário para uma página no frontend, passando o token
    // O frontend será responsável por ler o token da URL e salvá-lo.
    // Em produção, use uma URL do seu frontend.
    res.redirect(`${FRONT_URL}/auth-success?token=${token}`);
  }
);

module.exports = router;