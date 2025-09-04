const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('./db'); // Importa o pool do nosso arquivo db.js corrigido

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    const { displayName, emails, photos } = profile;
    const email = emails?.[0]?.value;
    const photoUrl = photos?.[0]?.value || null;

    if (!email) {
      return done(new Error("Não foi possível obter o e-mail do perfil do Google."), null);
    }

    try {
      // 1. Verifica se o usuário já existe no nosso banco de dados
      const selectSql = 'SELECT * FROM "Usuarios" WHERE email = $1';
      let { rows } = await pool.query(selectSql, [email]);
      let usuario = rows[0];

      if (usuario) {
        // 2. Se o usuário já existe, atualiza o nome e a foto (caso tenham mudado)
        const updateSql = 'UPDATE "Usuarios" SET nome = $1, photo_url = $2 WHERE id = $3 RETURNING *';
        const updatedResult = await pool.query(updateSql, [displayName, photoUrl, usuario.id]);
        usuario = updatedResult.rows[0];
        return done(null, usuario); // Passa o usuário atualizado
      } else {
        // 3. Se o usuário não existe, o cria com os dados do Google
        const insertSql = `
          INSERT INTO "Usuarios" (nome, email, photo_url, is_verified) 
          VALUES ($1, $2, $3, TRUE) 
          RETURNING *;
        `;
        const newResult = await pool.query(insertSql, [displayName, email, photoUrl]);
        const novoUsuario = newResult.rows[0];
        return done(null, novoUsuario);
      }
    } catch (error) {
      console.error("Erro na estratégia do Google Passport:", error);
      return done(error, null);
    }
  }
));


passport.serializeUser((user, done) => {

  done(null, (user).id);
});

passport.deserializeUser(async (id, done) => {
    try {
      const { rows } = await pool.query('SELECT * FROM "Usuarios" WHERE id = $1', [id]);
      done(null, rows[0]);
    } catch (error) {
      done(error, null);
    }
});