// src/app.js
require('dotenv').config();
const express = require('express');
const passport = require('passport');
const cors = require('cors');
// Imports para o Swagger
const swaggerUi = require('swagger-ui-express');
const { specs } = require('./config/swagger'); // Importa nossa configuração
// Configuração do Passport
require('./config/passport'); 

// Os caminhos para as rotas agora incluem a pasta "feat"
const categoriaRoutes = require('./feat/Categorias_Acessibilidade/categoria.routes');
const estabelecimentoRoutes = require('./feat/Estabelecimentos/estabelecimento.routes');
const itemRoutes = require('./feat/Itens_Acessibilidade/item.routes');
const avaliacaoRoutes = require('./feat/Avaliacoes/avaliacao.routes');
const usuarioRoutes = require('./feat/Usuarios/usuario.routes');
const comentarioRoutes = require('./feat/Comentarios/comentario.routes');
const rankingRoutes = require('./feat/Rankings/ranking.routes');
const tipoRoutes = require('./feat/Tipos/tipo.routes');

const authRoutes = require('./feat/Auth/auth.routes');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(passport.initialize());


app.use(express.json());

// Rota principal da API
app.get('/api', (req, res) => {
  res.send('API de Acessibilidade Rodando!');
});

// Usar as rotas (esta parte não muda)

app.use('/api/categorias', categoriaRoutes);
app.use('/api/estabelecimentos', estabelecimentoRoutes);
app.use('/api/itens', itemRoutes);
app.use('/api/avaliacoes', avaliacaoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/comentarios', comentarioRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/tipos', tipoRoutes);
//outras rotas
app.use('/api/auth', authRoutes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});