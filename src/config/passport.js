// src/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    // Esta função é chamada quando o Google nos redireciona de volta com sucesso.
    // 'profile' contém as informações do usuário do Google.
    const { id, displayName, emails, photos } = profile;
    const email = emails[0].value;

    const photoUrl = photos && photos.length > 0 ? photos[0].value : null;

    try {
      // Verifica se o usuário já existe no nosso banco de dados
      const [rows] = await pool.execute('SELECT * FROM Usuarios WHERE email = ?', [email]);
      let usuario = rows[0];

      if (usuario) {
        await pool.execute('UPDATE Usuarios SET photo_url = ? WHERE id = ?', [photoUrl, usuario.id]);
        usuario.photo_url = photoUrl; // Atualiza o objeto para o próximo passo
        return done(null, usuario); // Passa o usuário para o próximo passo
      } else {
        
         const [result] = await pool.execute(
          'INSERT INTO Usuarios (nome, email, photo_url, is_verified) VALUES (?, ?, ?, TRUE)',
          [displayName, email, photoUrl]
        );
        const novoUsuario = { id: result.insertId, nome: displayName, email, photo_url: photoUrl, role: 'user' };
        return done(null, novoUsuario);
      }
    } catch (error) {
      return done(error, null);
    }
  }
));

// Estas funções não são estritamente necessárias para um fluxo JWT sem sessão,
// mas são parte padrão da configuração do Passport.
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM Usuarios WHERE id = ?', [id]);
      done(null, rows[0]);
    } catch (error) {
      done(error, null);
    }
});