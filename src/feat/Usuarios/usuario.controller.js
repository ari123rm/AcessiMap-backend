const usuarioService = require('./usuario.service');

const register = async (req, res) => {
  try {
    const usuario = await usuarioService.register(req.body);
    res.status(201).json(usuario);
  } catch (error) {
    // Adicionar verificação para email duplicado
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Este email já está em uso.'});
    }
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { token } = await usuarioService.login(req.body);
    res.status(200).json({ token });
  } catch (error) {
    res.status(401).json({ message: error.message }); // 401 Unauthorized
  }
};
const verify = async (req, res) => {
  try {
    const { token } = req.body;
    const result = await usuarioService.verifyEmail(token);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
module.exports = { register, login, verify };