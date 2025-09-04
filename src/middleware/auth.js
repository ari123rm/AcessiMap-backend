const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // O token vem no header 'Authorization' no formato "Bearer TOKEN"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido ou em formato inválido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Adiciona as informações do usuário (payload do token) ao objeto da requisição
    req.usuario = decoded; 
    next(); // Passa para o próximo passo (o controller)
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}

module.exports = authMiddleware;